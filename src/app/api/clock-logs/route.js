import { promisePool } from "../../lib/db";
import { NextResponse } from 'next/server';

export async function POST(req) {
    console.log("DONE");
    const { emp_id } = await req.json();

    if (!emp_id) {
        return NextResponse.json({ message: 'emp_id is required' }, { status: 400 });
    }

    try {
        const [rows] = await promisePool.query(
            `SELECT date, start_work_time, end_work_time FROM Shift WHERE employee_id = ? ORDER BY date DESC LIMIT 10`,
            [emp_id]
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching clock logs:", error);
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}
