import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { trans_id, prod_id, quantity, price_each } = await request.json();

        // Check if a record with the same trans_id and prod_id already exists
        const [existingRecord] = await promisePool.query(
            `SELECT quantity FROM Transaction_Item 
             WHERE trans_id = ? AND prod_id = ?`,
            [trans_id, prod_id]
        );

        if (existingRecord.length > 0) {
            // Update the existing record
            const newQuantity = existingRecord[0].quantity + quantity;
            await promisePool.query(
                `UPDATE Transaction_Item 
                 SET quantity = ? 
                 WHERE trans_id = ? AND prod_id = ?`,
                [newQuantity, trans_id, prod_id]
            );

            return new Response(JSON.stringify({ message: 'Transaction item updated successfully' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // Insert a new record
            await promisePool.query(
                `INSERT INTO Transaction_Item (trans_id, prod_id, quantity, price_each)
               VALUES (?, ?, ?, ?)`,
                [trans_id, prod_id, quantity, price_each]
            );

            return new Response(JSON.stringify({ message: 'Transaction item created successfully' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to create/update transaction item' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}