"use client";
import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

const LoginPage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: sans-serif;
    background-color: #f0f0f0;
`;

const LoginBox = styled.div`
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    width: 350px;
`;

const Title = styled.h2`
    text-align: center;
    margin-bottom: 20px;
    color: #333;
`;

const InputGroup = styled.div`
    margin-bottom: 15px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 5px;
    color: #555;
`;

const Input = styled.input`
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 16px;
    &:focus {
        border-color: #007bff;
        outline: none;
        box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
    }
`;

const Button = styled.button`
    background-color: #007bff;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    &:hover {
        background-color: #0056b3;
    }
`;

const SubmitMessage = styled.p`
    text-align: center;
    margin-top: 10px;
    color: green;
`;

const LoginPageComponent = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitMessage, setSubmitMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage("กำลังตรวจสอบข้อมูล...");
        setLoading(true);

        try {
            const res = await fetch('/api/login/smth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emp_id: username, password: password }),
            });

            if (!res.ok) {
                setSubmitMessage("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
                return;
            }

            const data = await res.json();
            setSubmitMessage("เข้าสู่ระบบสำเร็จ!");

            setTimeout(() => {
                router.push('/'); // Redirect to homepage
            }, 2000);

        } catch (error) {
            console.error("Login error:", error);
            setSubmitMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginPage>
            <LoginBox>
                <Title>กรุณา login ด้วยรหัสพนักงาน เพื่อเข้าสู่ระบบ</Title>
                <form onSubmit={handleSubmit}>
                    <InputGroup>
                        <Label htmlFor="username">รหัสพนักงาน:</Label>
                        <Input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="กรอกรหัสพนักงาน"
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="password">รหัสผ่าน:</Label>
                        <Input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="วัน/เดือน/ปีเกิด ค.ศ. เช่น 31032005"
                        />
                    </InputGroup>
                    <Button type="submit" disabled={loading}>
                        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </Button>
                    {submitMessage && <SubmitMessage>{submitMessage}</SubmitMessage>}
                </form>
            </LoginBox>
        </LoginPage>
    );
};

export default LoginPageComponent;
