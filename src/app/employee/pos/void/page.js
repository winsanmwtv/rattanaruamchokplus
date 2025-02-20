"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const VoidReceiptPage = () => {
    const [receiptId, setReceiptId] = useState('');
    const [receiptDetails, setReceiptDetails] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const router = useRouter();

    const fetchReceiptDetails = async () => {
        if (!receiptId.trim()) return;
        setError('Fetching receipt details...');
        try {
            const response = await fetch('/api/void/get', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ receipt_id: receiptId }),
            });

            if (!response.ok) {
                setError('Receipt not found');
                setReceiptDetails(null);
                return;
            }

            const data = await response.json();
            setReceiptDetails(data);
            setError('');
        } catch (err) {
            console.error('Error fetching receipt details:', err);
            setError('An error occurred while fetching receipt details');
            setReceiptDetails(null);
        }
    };


    const handleCancelReceipt = async () => {
        if (!receiptDetails) return;

        try {
            const response = await fetch('/api/void/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ receipt_id: receiptDetails.receipt_id }), // Sending receipt_id as the body in JSON format
            });

            if (!response.ok) {
                setError('Failed to cancel receipt');
                return;
            }

            alert('Receipt has been canceled');
            handleReset(); // Assuming handleReset is a function that clears the state or form
        } catch (err) {
            console.error('Error canceling receipt:', err);
            setError('An error occurred while canceling the receipt');
        }
    };


    const handleReset = () => {
        setReceiptId('');
        setReceiptDetails(null);
        inputRef.current?.focus();
    };

    const keypadButtons = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0, 'Search'];

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Left Panel: Receipt Details */}
            <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                {receiptDetails ? (
                    <div style={{ border: '1px solid #ccc', padding: '10px' }}>
                        <h2>Receipt: {receiptDetails.receipt_id}</h2>
                        <p>Date: {receiptDetails.issue_date}</p>
                        <p>Branch: {receiptDetails.branch_id}</p>
                        <h3>Items:</h3>
                        <ul>
                            {receiptDetails.items.map((item) => (
                                <li key={item.prod_id}>
                                    {item.name_th} - {item.quantity} x {item.price_each} THB
                                </li>
                            ))}
                        </ul>
                        <button onClick={handleCancelReceipt} style={{ padding: '10px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
                            Cancel Receipt
                        </button>
                    </div>
                ) : (
                    <p>Please enter a receipt ID to search.</p>
                )}
            </div>

            {/* Right Panel: Input and Keypad */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <input
                    type="text"
                    placeholder="Enter Receipt ID"
                    value={receiptId}
                    onChange={(e) => setReceiptId(e.target.value)}
                    ref={inputRef}
                    style={{ padding: '10px', width: '100%', marginBottom: '10px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {keypadButtons.map((btn, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (btn === 'Search') {
                                    fetchReceiptDetails();
                                } else {
                                    setReceiptId((prev) => prev + btn.toString());
                                }
                            }}
                            style={{ padding: '20px', fontSize: '18px' }}
                        >
                            {btn}
                        </button>
                    ))}
                    <button onClick={handleReset} style={{ padding: '20px', fontSize: '18px', backgroundColor: 'gray', color: 'white' }}>
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoidReceiptPage;
