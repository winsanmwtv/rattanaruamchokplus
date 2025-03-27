import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { prod_id, quantity, branch_id } = await request.json();
        if (!prod_id || !quantity || !branch_id) {
            return new Response(JSON.stringify({ error: 'prod_id, quantity, and branch_id are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const [stockRows] = await promisePool.query(
            `SELECT back_quantity FROM Product WHERE barcode = ? AND branch_id = ? LIMIT 1`,
            [prod_id, branch_id]
        );
        if (stockRows.length === 0) {
            return new Response(JSON.stringify({ error: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        let backQuantity = stockRows[0].back_quantity;
        backQuantity += quantity;
        await promisePool.query(
            `UPDATE Product SET back_quantity = ? WHERE barcode = ? AND branch_id = ?`,
            [backQuantity, prod_id, branch_id]
        );
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Stock update error:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}