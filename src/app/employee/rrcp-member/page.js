'use client';
import { useState } from 'react';

export default function RRCPRegister() {
    const [formData, setFormData] = useState({
        name_th: '',
        surname_th: '',
        name_en: '',
        surname_en: '',
        tel_no: '',
        id_card: '',
        isStaff: false,
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            isStaff: formData.isStaff ? 1 : 0,
        };
        try {
            const res = await fetch('/api/rrcp-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setError('');
                setFormData({
                    name_th: '',
                    surname_th: '',
                    name_en: '',
                    surname_en: '',
                    tel_no: '',
                    id_card: '',
                    isStaff: false,
                });
            } else {
                setError(data.error || 'An error occurred.');
                setMessage('');
            }
        } catch (err) {
            setError(err.message);
            setMessage('');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>สมัครสมาชิก RRCP</h1>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxWidth: '400px'
                }}
            >
                <input
                    type="text"
                    name="name_th"
                    placeholder="ชื่อ (ไทย)"
                    value={formData.name_th}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="surname_th"
                    placeholder="นามสกุล (ไทย)"
                    value={formData.surname_th}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="name_en"
                    placeholder="ชื่อ (อังกฤษ)"
                    value={formData.name_en}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="surname_en"
                    placeholder="นามสกุล (อังกฤษ)"
                    value={formData.surname_en}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="tel_no"
                    placeholder="เบอร์โทรศัพท์"
                    value={formData.tel_no}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="id_card"
                    placeholder="เลขบัตรประชาชน"
                    value={formData.id_card}
                    onChange={handleChange}
                    required
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                        type="checkbox"
                        name="isStaff"
                        checked={formData.isStaff}
                        onChange={handleChange}
                    />
                    พนักงานหรือไม่
                </label>
                <button type="submit">สมัครสมาชิก</button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
