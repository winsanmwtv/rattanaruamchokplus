import { promisePool } from '../../lib/db';
import bcrypt from 'bcryptjs';

// GET: Retrieve all employees or a specific one by emp_id.
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const emp_id = searchParams.get('emp_id');
    try {
        let query = 'SELECT * FROM Employee';
        let params = [];
        if (emp_id) {
            query += ' WHERE emp_id = ?';
            params.push(emp_id);
        }
        const [rows] = await promisePool.query(query, params);
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// Helper function to generate a unique emp_id.
// Pattern: branch ("9000") + role digit + 3 random digits (ensuring no duplicate).
async function generateUniqueEmpId(role) {
    const branch = '9000';
    let emp_id;
    let exists = true;
    while (exists) {
        const randomPart = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0'); // 3 random digits
        emp_id = parseInt(branch + role + randomPart, 10);
        const [rows] = await promisePool.query('SELECT * FROM Employee WHERE emp_id = ?', [emp_id]);
        if (rows.length === 0) {
            exists = false;
        }
    }
    return emp_id;
}

// POST: Add a new employee.
export async function POST(req) {
    try {
        const data = await req.json();
        // Expected data from client: firstname, lastname, role, tel_no, birthdate, salary.
        // 'role' is provided as "1", "2", "3", or "4".
        const { firstname, lastname, role, tel_no, birthdate, salary, password } = data;
        let roleList = new Array(4);
        roleList[0] = "พนักงานหน้าร้าน";
        roleList[1] = "ผู้จัดการร้าน";
        roleList[2] = "พนักงานฝ่าย IT";
        // Auto-generate emp_id.
        const emp_id = await generateUniqueEmpId(role);
        // Default password is the emp_id as string if not provided.
        const pwdToHash = password ? password : emp_id.toString();
        const hashedPassword = await bcrypt.hash(pwdToHash, 12);
        const branch = '9000'; // Fixed branch.
        // Set startwork as today's date in yyyy-mm-dd format.
        const startwork = new Date().toISOString().split('T')[0];
        const img_path = '/empic/90000000.png'; // Fixed image path.

        const query = `
      INSERT INTO Employee
      (emp_id, password, firstname, lastname, role, tel_no, startwork, birthdate, salary, branch, img_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await promisePool.query(query, [
            emp_id,
            hashedPassword,
            firstname,
            lastname,
            roleList[role-1],
            tel_no,
            startwork,
            birthdate,
            salary,
            branch,
            img_path,
        ]);
        return Response.json({ message: 'Employee added successfully', emp_id });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update an existing employee.
// Allow editing all fields. If a new password is provided (non-empty), it is hashed.
export async function PUT(req) {
    try {
        const data = await req.json();
        // Expect emp_id and any fields to update.
        const { emp_id, password, firstname, lastname, role, tel_no, startwork, birthdate, salary, branch, img_path } = data;
        let fields = [];
        let values = [];
        if (firstname !== undefined) {
            fields.push('firstname = ?');
            values.push(firstname);
        }
        if (lastname !== undefined) {
            fields.push('lastname = ?');
            values.push(lastname);
        }
        if (role !== undefined) {
            fields.push('role = ?');
            values.push(role);
        }
        if (tel_no !== undefined) {
            fields.push('tel_no = ?');
            values.push(tel_no);
        }
        if (startwork !== undefined) {
            fields.push('startwork = ?');
            values.push(startwork);
        }
        if (birthdate !== undefined) {
            fields.push('birthdate = ?');
            values.push(birthdate);
        }
        if (salary !== undefined) {
            fields.push('salary = ?');
            values.push(salary);
        }
        if (branch !== undefined) {
            fields.push('branch = ?');
            values.push(branch);
        }
        if (img_path !== undefined) {
            fields.push('img_path = ?');
            values.push(img_path);
        }
        if (password !== undefined && password !== '') {
            const hashedPassword = await bcrypt.hash(password, 12);
            fields.push('password = ?');
            values.push(hashedPassword);
        }
        if (fields.length === 0) {
            return Response.json({ message: 'No fields to update' });
        }
        const query = `UPDATE Employee SET ${fields.join(', ')} WHERE emp_id = ?`;
        values.push(emp_id);
        await promisePool.query(query, values);
        return Response.json({ message: 'Employee updated successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove an employee by emp_id.
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const emp_id = searchParams.get('emp_id');
        if (!emp_id) {
            return Response.json({ error: 'emp_id is required' }, { status: 400 });
        }
        await promisePool.query('DELETE FROM Employee WHERE emp_id = ?', [emp_id]);
        return Response.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
