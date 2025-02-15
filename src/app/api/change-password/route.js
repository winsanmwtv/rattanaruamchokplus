import { promisePool } from "../../lib/db";
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
    const { password } = await req.json();

    try {
        const allCookies = cookies();
        const emp_id = allCookies.get('emp_id')?.value; // Get emp_id from cookies

        if (!emp_id) {
            return NextResponse.json({ message: 'Unauthorized. Employee ID not found.' }, { status: 401 });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the new password

        const [result] = await promisePool.query(
            `UPDATE Employee SET password = ? WHERE emp_id = ?`,
            [hashedPassword, emp_id]
        );

        if (result.affectedRows > 0) {
            return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Failed to update password. Employee ID might be incorrect.' }, { status: 400 }); // Or 404 if you want to be more specific
        }

    } catch (error) {
        console.error("Change Password API Error:", error);
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}