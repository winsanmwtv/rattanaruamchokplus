import { promisePool } from '../../lib/db';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');
    const branchId = 9000;

    try {
        let query = 'SELECT * FROM Product WHERE branch_id = ?';
        let params = [branchId];

        if (barcode) {
            query += ' AND barcode = ?';
            params.push(barcode);
        }

        const [rows] = await promisePool.query(query, params);
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const data = await req.json();
        // Only these fields come from the client
        const { barcode, name_th, name_en, price } = data;
        const branchId = 9000;

        const query = `INSERT INTO Product
                       (barcode, name_th, name_en, price, front_quantity, back_quantity, img_path, prod_type, is_bulk, bulk_quantity_each, single_barcode, is_valid_promo, branch_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await promisePool.query(query, [
            barcode,
            name_th,
            name_en,
            price,
            0,         // front_quantity always 0
            0,         // back_quantity always 0
            null,      // img_path null
            null,      // prod_type null
            0,         // is_bulk always 0
            null,      // bulk_quantity_each null
            null,      // single_barcode removed
            0,         // is_valid_promo always 0
            branchId,
        ]);

        return Response.json({ message: 'Product added successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const data = await req.json();
        // Expecting at least barcode, name_th, name_en, price
        const { barcode, name_th, name_en, price } = data;
        const branchId = 9000;

        // Build an update query for the fields that can be edited
        const query = `
      UPDATE Product 
      SET name_th = ?, name_en = ?, price = ?
      WHERE barcode = ? AND branch_id = ?`;

        await promisePool.query(query, [
            name_th,
            name_en,
            price,
            barcode,
            branchId,
        ]);
        return Response.json({ message: 'Product updated successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const barcode = searchParams.get('barcode');
        const branchId = 9000;

        if (!barcode) {
            return Response.json({ error: 'Barcode is required' }, { status: 400 });
        }

        await promisePool.query(
            'DELETE FROM Product WHERE barcode = ? AND branch_id = ?',
            [barcode, branchId]
        );
        return Response.json({ message: 'Product deleted successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
