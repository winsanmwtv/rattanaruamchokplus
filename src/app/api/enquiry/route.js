import { promisePool } from '../../lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');

    if (!barcode) {
        return new Response(JSON.stringify({ error: 'barcode is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const [rows] = await promisePool.query(
            `SELECT barcode, name_th, price, front_quantity, back_quantity, is_bulk, bulk_quantity_each, single_barcode 
             FROM Product 
             WHERE barcode = ? AND branch_id = 9000 LIMIT 1`,
            [barcode]
        );

        if (rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let product = rows[0];
        if (product.is_bulk && product.single_barcode) {
            const [singleRows] = await promisePool.query(
                `SELECT price FROM Product WHERE barcode = ? AND branch_id = 9000 LIMIT 1`,
                [product.single_barcode]
            );
            product.single_price = singleRows.length > 0 ? singleRows[0].price : null;
        }

        return new Response(JSON.stringify(product), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
