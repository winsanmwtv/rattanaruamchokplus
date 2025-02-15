import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { prod_id, quantity, branch_id } = await request.json();

        console.log(prod_id, quantity);

        if (!prod_id || !quantity || !branch_id) {
            return new Response(JSON.stringify({ error: 'prod_id, quantity, and branch_id are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 1. Get current stock (prioritize front_quantity, then back_quantity)
        const [stockRows] = await promisePool.query(
            `SELECT front_quantity, back_quantity FROM Product WHERE barcode = ? AND branch_id = ? LIMIT 1`,
            [prod_id, branch_id]
        );

        if (stockRows.length === 0) {
            return new Response(JSON.stringify({ error: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let frontQuantity = stockRows[0].front_quantity;
        let backQuantity = stockRows[0].back_quantity;

        // 2. Check if enough stock (prioritize front_quantity)
        let quantityToDeduct = quantity;

        if (frontQuantity >= quantityToDeduct) {
            frontQuantity -= quantityToDeduct;
            quantityToDeduct = 0;
        } else {
            quantityToDeduct -= frontQuantity;
            frontQuantity = 0;

            // Allow back_quantity to go negative if necessary
            backQuantity -= quantityToDeduct;  // Directly subtract from back_quantity
            quantityToDeduct = 0; // All deducted
        }


        // 3. Update stock in the database (prioritize front_quantity)
        await promisePool.query(
            `UPDATE Product SET front_quantity = ?, back_quantity = ? WHERE barcode = ? AND branch_id = ?`,
            [frontQuantity, backQuantity, prod_id, branch_id]
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