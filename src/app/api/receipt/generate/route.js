import { promisePool } from '../../../lib/db';

export async function GET(request) {
    const branchId = 9000; // Temporary branch ID
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    try {
        const [rows] = await promisePool.query(
            `SELECT receipt_id FROM Receipt 
       WHERE receipt_id LIKE ? ORDER BY receipt_id DESC LIMIT 1`,
            [`${today}${branchId}%`]
        );

        let nextNumber = '0001';
        if (rows.length > 0) {
            const lastReceipt = rows[0].receipt_id;
            const lastNumber = parseInt(lastReceipt.slice(-4)) + 1;
            nextNumber = lastNumber.toString().padStart(4, '0');
        }

        const newReceiptId = `${today}${branchId}${nextNumber}`;
        return new Response(JSON.stringify({ receipt_id: newReceiptId }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
