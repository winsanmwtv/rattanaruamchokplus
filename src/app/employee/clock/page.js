"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsCookie from 'js-cookie';
import styled from "styled-components";

const SubmitMessage = styled.p`
    text-align: center;
    margin-top: 10px;
    color: green;
`;

const ClockPage = () => {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [empId, setEmpId] = useState("EMP001"); // Dummy data
    const [firstName, setFirstName] = useState("สมชาย"); // Dummy data
    const [lastName, setLastName] = useState("ใจดี"); // Dummy data
    const [loading, setLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            setCurrentDate(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Get employee data from cookie
        const fetchedEmpId = jsCookie.get('emp_id');
        const fetchedFirstName = jsCookie.get('firstName');
        const fetchedLastName = jsCookie.get('lastName');

        if (fetchedEmpId) setEmpId(fetchedEmpId);
        if (fetchedFirstName) setFirstName(fetchedFirstName);
        if (fetchedLastName) setLastName(fetchedLastName);
    }, []);

    const handleClockIn = async (e) => {
        e.preventDefault();
        setSubmitMessage("");
        setLoading(true);

        console.log(empId);

        try {
            const res = await fetch('/api/clock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emp_id: empId, endOfDay: false }),
            });

            if (!res.ok) {
                setSubmitMessage("เกิดข้อผิดพลาดในระบบ (มีการบันทึกเวลาซ้ำหรือไม่)");
                return;
            }

            const data = await res.json();
            setSubmitMessage("ทำการบันทึกเวลาเข้างานเรียบร้อย");

        } catch (error) {
            console.error("Login error:", error);
            setSubmitMessage("เกิดข้อผิดพลาดในระบบ");
        } finally {
            setLoading(false);
        }
        console.log("Clock In clicked");
    };

    const handleClockOut = async (e) => {
        e.preventDefault();
        setSubmitMessage("");
        setLoading(true);

        try {
            const res = await fetch('/api/clock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emp_id: empId, endOfDay: true }),
            });

            if (!res.ok) {
                setSubmitMessage("เกิดข้อผิดพลาดในระบบ");
                return;
            }

            const data = await res.json();
            setSubmitMessage("ทำการบันทึกเวลาออกงานเรียบร้อย");

        } catch (error) {
            console.error("Login error:", error);
            setSubmitMessage("เกิดข้อผิดพลาดในระบบ");
        } finally {
            setLoading(false);
        }
        console.log("Clock Out clicked");
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100vh',
            justifyContent: 'center'
        }}>
            {/* Employee Info */}
            <div style={{marginBottom: '20px', textAlign: 'center'}}>
                <p><strong>รหัสพนักงาน:</strong> {empId}</p>
                <p><strong>ชื่อ:</strong> {firstName} {lastName}</p>
            </div>

            {/* Large Clock */}
            <div style={{fontSize: '4rem', marginBottom: '10px'}}>
                {currentTime.toLocaleTimeString('th-TH', {hour12: false})}
            </div>

            {/* Smaller Date/Time */}
            <div style={{fontSize: '1.2rem', marginBottom: '30px'}}>
                {currentDate.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
            </div>
            <div style={{fontSize: '1.2rem', marginBottom: '30px'}}>

                {submitMessage && <SubmitMessage>{submitMessage}</SubmitMessage>}
            </div>

            {/* Buttons */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'}}>
                <button onClick={handleClockIn} style={buttonStyleGreen}>
                    เคาะเวลาเข้างาน
                </button>
                <button onClick={handleClockOut} style={buttonStyleRed}>
                    เคาะเวลาออกงาน
                </button>
                <button onClick={() => router.push('/employee/clock/logs')} style={buttonStyle}>
                    เช็คข้อมูลย้อนหลัง
                </button>
                <button onClick={() => router.push('/employee/report')} style={buttonStyle}>
                    แจ้งลาป่วย/ลาพักร้อน
                </button>
            </div>
        </div>
    );
};

const buttonStyle = {
    padding: '20px',
    fontSize: '1.2rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
};

const buttonStyleGreen = {
    padding: '20px',
    fontSize: '1.2rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#179535',
    color: 'white',
};

const buttonStyleRed = {
    padding: '20px',
    fontSize: '1.2rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#c61717',
    color: 'white',
};

export default ClockPage;