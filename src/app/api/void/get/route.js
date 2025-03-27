import { promisePool } from '../../../lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const receipt_id = searchParams.get('receipt_id');
    if (!receipt_id) {
        return new Response(JSON.stringify({ error: 'receipt_id is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    try {
        const [receiptRows] = await promisePool.query(
            'SELECT receipt_id, issue_date, branch_id FROM Receipt WHERE receipt_id = ? LIMIT 1',
            [receipt_id]
        );
        if (receiptRows.length === 0) {
            return new Response(JSON.stringify({ error: 'Receipt not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const receipt = receiptRows[0];
        const [itemRows] = await promisePool.query(
            `SELECT ri.prod_id, ri.quantity, ri.price_each, p.name_th
             FROM Receipt_Item ri
                      JOIN Product p ON ri.prod_id = p.barcode
             WHERE ri.receipt_id = ?`,
            [receipt_id]
        );
        receipt.items = itemRows;
        return new Response(JSON.stringify(receipt), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Error fetching receipt details:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
