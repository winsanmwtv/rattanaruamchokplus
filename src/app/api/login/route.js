import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { promisePool } from "../../lib/db"; // Database pool for querying MySQL

export async function POST(request) {
    try {
        const { emp_id, password } = await request.json();
        const [rows] = await promisePool.query(
            "SELECT emp_id, password, firstname, lastname, role, img_path FROM employees WHERE emp_id = ?",
            [emp_id]
        );

        console.log(rows);  // Debugging the query result.

        if (rows.length === 0) {
            return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });
        }

        const user = rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });
        }

        const response = NextResponse.json({
            message: "Login successful",
            user: {
                emp_id: user.emp_id,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role,
                img_path: user.img_path,
            },
        });

        response.cookies.set("emp_id", user.emp_id, { httpOnly: true });
        response.cookies.set("firstname", user.firstname, { httpOnly: true });
        response.cookies.set("lastname", user.lastname, { httpOnly: true });
        response.cookies.set("role", user.role, { httpOnly: true });
        response.cookies.set("img_path", user.img_path, { httpOnly: true });

        return response;
    } catch (error) {
        console.error("Error during login:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
