import { promisePool } from "../../../lib/db"; // Ensure the path is correct
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
    console.log("API received a request");

    const { emp_id, password } = await req.json(); // Ensure JSON parsing works

    try {
        const [rows] = await promisePool.query(
            `SELECT * FROM Employee WHERE emp_id = ?`,
            [emp_id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const user = rows[0];

        // Ensure passwords are hashed in DB before using bcrypt.compare
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Set cookies for session
        cookies().set('emp_id', user.emp_id, { maxAge: 1000000000000, path: '/' }); // 30 minutes
        cookies().set('firstName', user.firstname, { maxAge: 1000000000000, path: '/' });
        cookies().set('lastName', user.lastname, { maxAge: 1000000000000, path: '/' });
        cookies().set('employeeType', user.role, { maxAge: 1000000000000, path: '/' });
        cookies().set('avatarUrl', user.img_path, { maxAge: 1000000000000, path: '/' });

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            firstName: user.firstname,
            lastName: user.lastname,
            emp_id: user.emp_id,
            role: user.role,
            avatarUrl: user.img_path
        }, { status: 200 });

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}
