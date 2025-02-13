"use client";

import React, { useState, useEffect } from 'react';
import jsCookie from 'js-cookie';

const ClockLogsPage = () => {
    const [clockLogs, setClockLogs] = useState([]);
    const [empId, setEmpId] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    useEffect(() => {
        // Fetch employee data from cookie
        const fetchedEmpId = jsCookie.get('emp_id');
        const fetchedFirstName = jsCookie.get('firstName');
        const fetchedLastName = jsCookie.get('lastName');

        if (fetchedEmpId) setEmpId(fetchedEmpId);
        if (fetchedFirstName) setFirstName(fetchedFirstName);
        if (fetchedLastName) setLastName(fetchedLastName);

        // Fetch clock logs data (replace with your actual API endpoint)
        const fetchClockLogs = async () => {
            try {
                const data = await fetch('/api/clock-logs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ emp_id: empId }),
                });

                if (!data.ok) {
                    return;
                }

                const clockData = await data.json();

                // Sort logs by date (newest first) and take the last 10
                const sortedLogs = clockData.sort((a, b) => new Date(b.date) - new Date(a.date));
                const last10Logs = sortedLogs.slice(0, 10);

                setClockLogs(last10Logs);
            } catch (error) {
                console.error("Error fetching clock logs:", error);
                // Handle error (e.g., display an error message)
            }
        };

        fetchClockLogs();
    }, [empId]); // Re-fetch logs if empId changes (e.g., user logs in as a different employee)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'flex-start', paddingTop: '20px' }}>
            {/* Employee Info */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <p><strong>รหัสพนักงาน:</strong> {empId}</p>
                <p><strong>ชื่อ:</strong> {firstName} {lastName}</p>
            </div>

            {/* Clock Logs Table */}
            <table style={{ width: '80%', borderCollapse: 'collapse' }}>
                <thead>
                <tr>
                    <th style={tableHeaderStyle}>ลำดับ</th>
                    <th style={tableHeaderStyle}>วันที่</th>
                    <th style={tableHeaderStyle}>ชื่อ</th>
                    <th style={tableHeaderStyle}>เวลาเข้างาน</th>
                    <th style={tableHeaderStyle}>เวลาออกงาน</th>
                    <th style={tableHeaderStyle}>หมายเหตุ</th>
                </tr>
                </thead>
                <tbody>
                {clockLogs.map((log, index) => (
                    <tr key={index} style={tableRowStyle}>
                        <td style={tableCellStyle}>{index + 1}</td>
                        <td style={tableCellStyle}>{new Date(log.date).toLocaleDateString('th-TH')}</td>
                        <td style={tableCellStyle}>{firstName} {lastName}</td>
                        <td style={tableCellStyle}>{log.start_working_time || "-"}</td>
                        <td style={tableCellStyle}>{log.end_working_time || "-"}</td>
                        <td style={tableCellStyle}>
                            {
                                (log.start_working_time === null && log.end_working_time !== null)
                                    ? "ไม่พบบันทึกเวลาเข้างาน"
                                    : ""
                            }
                        </td>
                    </tr>
                ))}
                {clockLogs.length === 0 && (
                    <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '10px' }}>
                            ไม่มีข้อมูล
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};

// Styles for the table
const tableHeaderStyle = {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    border: '1px solid #ddd',
    textAlign: 'left',
};

const tableCellStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    textAlign: 'left',
};

const tableRowStyle = {
    backgroundColor: '#f9f9f9',
};

// Export the component as default
export default ClockLogsPage;
