// src/app/api/softlogin/route.js
import { promisePool } from "../../lib/db";

export async function POST(request) {
    try {
        const { emp_id, password } = await request.json();  // Extract login data

        // Soft login logic (to be defined, similar to regular login)
        // Query the database and verify the credentials.
        // This could involve checking for session cookies or token validation.

        return new NextResponse("Soft login successful", { status: 200 });

    } catch (error) {
        console.error("Error in soft login route:", error);
        return new NextResponse("Error processing soft login", { status: 500 });
    }
}
