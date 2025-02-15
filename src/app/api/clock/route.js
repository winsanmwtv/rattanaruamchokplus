import { promisePool } from "../../lib/db";
import { NextResponse } from 'next/server';

export async function POST(req) {
    console.log("API received a request");

    const { emp_id, endOfDay } = await req.json();

    try {
        const nowUTC = new Date(); // Get current time in UTC

        // Get the Bangkok time offset in milliseconds.  Bangkok is UTC+7.
        const bangkokOffset = 7 * 60 * 60 * 1000; // 7 hours * 60 min/hour * 60 sec/min * 1000 ms/sec

        // Create a Date object representing the time in Bangkok
        const nowBangkok = new Date(nowUTC.getTime() + bangkokOffset);

        const dateBangkok = nowBangkok.toISOString().slice(0, 10); // Format date as YYYY-MM-DD
        const timeBangkok = nowBangkok.toISOString().slice(11, 19);  // Format time as HH:MM:SS


        let rows = [];
        if (!endOfDay) {
            [rows] = await promisePool.query(
                `SELECT start_work_time FROM Shift WHERE employee_id = ? AND date = ?`,
                [emp_id, dateBangkok]
            );
        } else {
            [rows] = await promisePool.query(
                `SELECT end_work_time FROM Shift WHERE employee_id = ? AND date = ?`,
                [emp_id, dateBangkok]
            );
        }

        const user = rows[0];

        if (rows.length === 0 && !endOfDay) {
            await promisePool.query(
                `INSERT INTO Shift (employee_id, date, start_work_time) values(?, ?, ?)`,
                [emp_id, dateBangkok, timeBangkok]
            );
            return NextResponse.json({
                success: true,
                message: 'Clock-in Successful',
                emp_id,
                date: dateBangkok,
                time: timeBangkok
            }, { status: 200 });
        } else if (rows.length === 0 && endOfDay) {
            await promisePool.query(
                `INSERT INTO Shift (employee_id, date, end_work_time) values(?, ?, ?)`,
                [emp_id, dateBangkok, timeBangkok]
            );
            return NextResponse.json({
                success: true,
                message: 'Clock-out Successful',
                emp_id: user?.emp_id,
                date: dateBangkok,
                time: timeBangkok
            }, { status: 200 });
        } else if (rows.length > 0 && endOfDay) {
            await promisePool.query(
                `UPDATE Shift
                 SET end_work_time = ?
                 WHERE employee_id = ? AND date = ?`,
                [timeBangkok, emp_id, dateBangkok]
            );
            return NextResponse.json({
                success: true,
                message: 'Clock-out Successful',
                emp_id: user?.emp_id,
                date: dateBangkok,
                time: timeBangkok
            }, { status: 200 });
        } else if (rows.length > 0 && !endOfDay) {
            return NextResponse.json({ message: 'Clock-in Duplicated, Unchanged' }, { status: 401 });
        } else {
            return NextResponse.json({ message: 'Something happened at our end' }, { status: 500 });
        }

    } catch (error) {
        console.error("Shift API Error:", error);
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}