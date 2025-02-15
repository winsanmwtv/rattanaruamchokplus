import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { receipt_id, prod_id, quantity, price_each } = await request.json();

        // Check if a record with the same receipt_id and prod_id already exists
        const [existingRecord] = await promisePool.query(
            `SELECT quantity FROM Receipt_Item 
             WHERE receipt_id = ? AND prod_id = ?`,
            [receipt_id, prod_id]
        );

        if (existingRecord.length > 0) {
            // Update the existing record
            const newQuantity = existingRecord[0].quantity + quantity; // Add the new quantity to the old
            await promisePool.query(
                `UPDATE Receipt_Item 
                 SET quantity = ? 
                 WHERE receipt_id = ? AND prod_id = ?`,
                [newQuantity, receipt_id, prod_id]
            );

            return new Response(JSON.stringify({ message: 'Receipt item updated successfully' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // Insert a new record
            await promisePool.query(
                `INSERT INTO Receipt_Item (receipt_id, prod_id, quantity, price_each)
               VALUES (?, ?, ?, ?)`,
                [receipt_id, prod_id, quantity, price_each]
            );

            return new Response(JSON.stringify({ message: 'Receipt item created successfully' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to create/update receipt item' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}