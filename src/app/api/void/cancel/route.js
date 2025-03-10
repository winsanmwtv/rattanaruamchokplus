import { promisePool } from '../../../lib/db';

export async function POST(request) {
    try {
        const { receipt_id } = await request.json();

        if (!receipt_id) {
            return new Response(JSON.stringify({ error: 'receipt_id is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        // Fetch receipt items
        const [items] = await connection.query(
            'SELECT prod_id, quantity FROM Receipt_Item WHERE receipt_id = ?',
            [receipt_id]
        );

        if (items.length === 0) {
            await connection.release();
            return new Response(JSON.stringify({ error: 'No items found for this receipt' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Restore stock levels
        for (const item of items) {
            await connection.query(
                'UPDATE Product SET back_quantity = back_quantity + ? WHERE barcode = ?',
                [item.quantity, item.prod_id]
            );
        }

        // Mark receipt as voided
        await connection.query(
            'DELETE FROM Receipt WHERE receipt_id = ?',
            [receipt_id]
        );

        await connection.query(
            'DELETE FROM Receipt_Item WHERE receipt_id = ?',
            [receipt_id]
        );

        await connection.commit();
        connection.release();

        return new Response(JSON.stringify({ message: 'Receipt canceled successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error canceling receipt:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
