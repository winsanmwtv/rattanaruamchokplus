import { promisePool } from "../../lib/db"; // Ensure the path is correct
import { NextResponse } from 'next/server';

export async function POST(req) {
    console.log("API received a request");

    const { emp_id, endOfDay } = await req.json();
    const now = new Date();

    const date = now.getDate();
    const month = now.getMonth()+1;
    const year = now.getFullYear();

    const calendarDate = year+"-"+month+"-"+date;

    const time = now.toLocaleTimeString("th-TH", { hour12: false });

    try {

        let rows = [];
        if (!endOfDay) { // start time
            [rows] = await promisePool.query(
                `SELECT start_work_time FROM Shift WHERE employee_id = ? AND date = ?`,
                [emp_id, calendarDate] // Pass both values inside the same array
            );
        } else { // end time
            [rows] = await promisePool.query(
                `SELECT end_work_time FROM Shift WHERE employee_id = ? AND date = ?`,
                [emp_id, calendarDate] // Pass both values inside the same array
            );
        }

        const user = rows[0];

        if (rows.length === 0 && !endOfDay) { // start work time and not enter time yet
            await promisePool.query(
                `INSERT INTO Shift (employee_id, date, start_work_time) values(?, ?, ?)`,
                [emp_id, calendarDate, time]
            );
            return NextResponse.json({
                success: true,
                message: 'Clock-in Successful',
                emp_id,
                date: calendarDate,
                time: time
            }, { status: 200 });
        } else if (rows.length === 0 && endOfDay) {
            await promisePool.query(
                `INSERT INTO Shift (employee_id, date, end_work_time) values(?, ?, ?)`,
                [emp_id, calendarDate, time]
            );
            return NextResponse.json({
                success: true,
                message: 'Clock-out Successful',
                emp_id: user.emp_id,
                date: calendarDate,
                time: time
            }, { status: 200 });
        } else if (rows.length > 0 && endOfDay) {
            await promisePool.query(
                `UPDATE Shift
                 SET end_work_time = ?
                 WHERE employee_id = ? AND date = ?`,
                [time, emp_id, calendarDate] // Order must match the query placeholders
            );
            return NextResponse.json({
                success: true,
                message: 'Clock-out Successful (Duplicated)',
                emp_id: user.emp_id,
                date: calendarDate,
                time: time
            }, { status: 200 });
        } else if (rows.length > 0 && !endOfDay) {
            return NextResponse.json({ message: 'Clock-in Duplicated, Unchanged' }, { status: 401 });
        } else {
            return NextResponse.json({ message: 'Something happened at our end' }, { status: 401 });
        }

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}
