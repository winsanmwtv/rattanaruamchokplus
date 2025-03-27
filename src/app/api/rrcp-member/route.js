import { promisePool } from '../../lib/db';

export async function POST(req) {
    try {
        const { name_th, surname_th, name_en, surname_en, tel_no, id_card, isStaff } = await req.json();

        // Compute masked names: first character plus three asterisks
        const maskedThaiName = name_th ? name_th + ' ' + surname_th[0] + '***' : 'ไม่ระบุชื่อสมาชิก';
        const maskedEngName = name_en ? name_en + ' ' + surname_en[0] + '***' : 'Name Unspecified';

        const branchId = 9000;
        const price = 0;
        const front_quantity = 2147483647; // INT MAX to simulate infinity
        const back_quantity = 0;
        const img_path = null;
        const prod_type = null;
        const is_bulk = 0;
        const bulk_quantity_each = null;
        const single_barcode = null;
        const is_valid_promo = 0;

        const [rows] = await promisePool.query(
            `SELECT emp_id FROM Employee WHERE tel_no = ? LIMIT 1`,
            [tel_no]
        );

        let prodNameTh_tel;
        let prodNameEn_tel;

        // For Tel No product:
        if (isStaff == 0) {
            prodNameTh_tel = `รหัสสมาชิกถูกต้อง (${maskedThaiName})`;
            prodNameEn_tel = `Validate Member (${maskedEngName})`;
        } else if (rows.length > 0) {
            prodNameTh_tel = `ส่วนลดพนักงาน (STID: ${rows[0].emp_id})`;
            prodNameEn_tel = `Staff Discount (STID: ${rows[0].emp_id})`;
        } else {
            prodNameTh_tel = `ส่วนลดพนักงาน (${maskedThaiName})`;
            prodNameEn_tel = `Staff Discount (${maskedEngName})`;
        }
        const queryTel = `
      INSERT INTO Product 
      (barcode, name_th, name_en, price, front_quantity, back_quantity, img_path, prod_type, is_bulk, bulk_quantity_each, single_barcode, is_valid_promo, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await promisePool.query(queryTel, [
            tel_no,
            prodNameTh_tel,
            prodNameEn_tel,
            price,
            front_quantity,
            back_quantity,
            img_path,
            prod_type,
            is_bulk,
            bulk_quantity_each,
            single_barcode,
            is_valid_promo,
            branchId,
        ]);

        // For ID Card product:
        const queryId = `
      INSERT INTO Product 
      (barcode, name_th, name_en, price, front_quantity, back_quantity, img_path, prod_type, is_bulk, bulk_quantity_each, single_barcode, is_valid_promo, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await promisePool.query(queryId, [
            id_card,
            prodNameTh_tel,
            prodNameEn_tel,
            price,
            front_quantity,
            back_quantity,
            img_path,
            prod_type,
            is_bulk,
            bulk_quantity_each,
            single_barcode,
            is_valid_promo,
            branchId,
        ]);

        return Response.json({ message: 'การทำรายการสมัครสมาชิกเสร็จสมบูรณ์' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
