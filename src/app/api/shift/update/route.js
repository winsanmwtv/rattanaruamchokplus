import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { date, emp_id, increment } = await request.json();
        await promisePool.query(
            `UPDATE Shift SET counted_cashier = counted_cashier + ? 
       WHERE date = ? AND employee_id = ?`,
            [increment, date, emp_id]
        );
        return new Response(JSON.stringify({ message: 'Shift updated successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to update shift' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
