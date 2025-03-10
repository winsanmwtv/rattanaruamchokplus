import { promisePool } from '../../../lib/db';

export async function GET(request) {
    try {
        // Query all receipts ordered descending by receipt_id (or adjust to your ordering criteria)
        const [rows] = await promisePool.query(
            "SELECT receipt_id, issue_date, branch_id FROM Receipt ORDER BY receipt_id DESC"
        );
        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching receipts:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
