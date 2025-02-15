'use client';

import { useState } from 'react';
import styled, { css } from 'styled-components';

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f4f4f4;
`;

const ContentContainer = styled.div`
    background-color: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
    width: 400px;
`;

const Title = styled.h2`
    text-align: center;
    margin-bottom: 25px;
    color: #333;
    font-size: 1.8rem;
    font-weight: 600;
`;

const InputGroup = styled.div`
    margin-bottom: 20px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-weight: 500;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 16px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    &:focus {
        border-color: #80bdff;
        outline: none;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
`;

const Button = styled.button`
    background-color: #007bff;
    color: white;
    padding: 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    font-weight: 500;
    transition: background-color 0.15s ease-in-out;
    &:hover {
        background-color: #0056b3;
    }
    &:disabled {
        background-color: #cccccc;
        cursor: default;
    }
`;

const Message = styled.p`
    text-align: center;
    margin-top: 15px;
    ${(props) =>
            props.type === 'success' &&
            css`
                color: green;
            `}
    ${(props) =>
            props.type === 'error' &&
            css`
                color: red;
            `}
`;

export default function ChangePasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน"); // Thai
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"); // Thai
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: newPassword }),
            });

            if (response.ok) {
                setMessage('เปลี่ยนรหัสผ่านสำเร็จ!'); // Thai
                setError('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const data = await response.json();
                setError(data.message || 'เปลี่ยนรหัสผ่านล้มเหลว.'); // Thai
                setMessage('');
            }
        } catch (err) {
            console.error("Error changing password:", err);
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง.'); // Thai
            setMessage('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <ContentContainer>
                <Title>เปลี่ยนรหัสผ่าน</Title> {/* Thai */}

                <form onSubmit={handleSubmit}>
                    <InputGroup>
                        <Label htmlFor="newPassword">รหัสผ่านใหม่:</Label> {/* Thai */}
                        <Input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน:</Label> {/* Thai */}
                        <Input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </InputGroup>

                    <Button type="submit" disabled={loading}>
                        {loading ? "กำลังบันทึก..." : "บันทึก"} {/* Thai */}
                    </Button>

                    {message && <Message type="success">{message}</Message>}
                    {error && <Message type="error">{error}</Message>}
                </form>
            </ContentContainer>
        </PageContainer>
    );
}