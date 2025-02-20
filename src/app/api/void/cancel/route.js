import { promisePool } from '../../../lib/db';

export async function POST(request) {
    const { receipt_id } = await request.json();

    if (!receipt_id) {
        return new Response(
            JSON.stringify({ error: 'Receipt ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const connection = await promisePool.getConnection();

    try {
        // Check if the receipt exists without locking
        const [receiptRows] = await connection.query(
            'SELECT receipt_id FROM Receipt WHERE receipt_id = ?',
            [receipt_id]
        );

        if (receiptRows.length === 0) {
            await connection.release();
            return new Response(
                JSON.stringify({ error: 'Receipt not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Fetch receipt items
        const [itemRows] = await connection.query(
            'SELECT prod_id, quantity FROM Receipt_Item WHERE receipt_id = ?',
            [receipt_id]
        );

        // Update product stock levels for each item
        for (const item of itemRows) {
            await connection.query(
                'UPDATE Product SET front_quantity = front_quantity + ? WHERE barcode = ?',
                [item.quantity, item.prod_id]
            );
        }

        // Delete receipt items first (as foreign key constraints may require it)
        await connection.query(
            'DELETE FROM Receipt_Item WHERE receipt_id = ?',
            [receipt_id]
        );

        // Now delete the receipt
        await connection.query(
            'DELETE FROM Receipt WHERE receipt_id = ?',
            [receipt_id]
        );

        await connection.release();

        return new Response(
            JSON.stringify({ message: 'Receipt and its items deleted successfully' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error deleting receipt:', error);
        await connection.release();
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
