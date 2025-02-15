import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { receipt_id, trans_id, branch_id, issue_date } = await request.json();
        await promisePool.query(
            `INSERT INTO Receipt (receipt_id, trans_id, issue_date, branch_id)
       VALUES (?, ?, ?, ?)`,
            [receipt_id, trans_id, issue_date, branch_id]
        );

        return new Response(JSON.stringify({ message: 'Receipt created successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to create receipt' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
