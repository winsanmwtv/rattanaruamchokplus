import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { emp_id, branch_id, total_price, status, payment_type } = await request.json();
        // Assuming Transaction table has an auto-increment trans_id and a datetime column
        const [result] = await promisePool.query(
            `INSERT INTO Transaction (emp_id, branch_id, date, total_price, status, payment_type)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
            [emp_id, branch_id, total_price, status, payment_type]
        );

        // Return the new transaction id (result.insertId)
        return new Response(JSON.stringify({ trans_id: result.insertId }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
