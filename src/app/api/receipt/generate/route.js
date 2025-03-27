import { promisePool } from '../../../lib/db';

export async function POST(request) {
    const branchId = 9000; // Temporary branch ID
    const today = new Date();
    const formattedDate = String(today.getFullYear()) +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');
    try {
        const { staffId } = await request.json();
        const finalStaff = staffId+""+branchId;
        const [rows] = await promisePool.query(
            `SELECT receipt_id FROM Receipt
             WHERE receipt_id LIKE ? ORDER BY receipt_id DESC LIMIT 1`,
            [`${formattedDate}${finalStaff}%`]
        );
        let nextNumber = '0001';
        if (rows.length > 0) {
            const lastReceipt = rows[0].receipt_id;
            const lastNumber = parseInt(lastReceipt.slice(-4)) + 1;
            nextNumber = lastNumber.toString().padStart(4, '0');
        }
        const newReceiptId = `${formattedDate}${finalStaff}${nextNumber}`;
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
