"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Helper to get a cookie value by name
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const EnquiryPage = () => {
    const [barcode, setBarcode] = useState("");
    const [product, setProduct] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const barcodeInputRef = useRef(null);
    const router = useRouter();

    // ---------------- LOGOUT FUNCTION ----------------
    const handleLogout = () => {
        document.cookie = "emp_id=; path=/; max-age=0";
        document.cookie = "firstName=; path=/; max-age=0";
        document.cookie = "lastName=; path=/; max-age=0";
        document.cookie = "employeeType=; path=/; max-age=0";
        document.cookie = "avatarUrl=; path=/; max-age=0";
        router.push("/login");
    };

    // ---------------- ENQUIRY HANDLERS ----------------
    const handleBarcodeSubmit = async (submittedBarcode) => {
        setErrorMessage("กำลังดึงข้อมูลสินค้า...");
        const barcodeToSubmit = submittedBarcode || barcode;
        if (barcodeToSubmit.trim() !== "") {
            try {
                const res = await fetch(`/api/enquiry?barcode=${barcodeToSubmit}`, { method: 'GET' });
                if (!res.ok) {
                    setErrorMessage("ไม่พบสินค้า");
                    setProduct(null);
                    setBarcode("");
                    barcodeInputRef.current?.focus();
                    return;
                }
                const data = await res.json();
                setProduct(data);
                setErrorMessage("");
            } catch (error) {
                console.error("Error fetching product:", error);
                setErrorMessage("เกิดข้อผิดพลาดขณะดึงข้อมูลสินค้า");
                setProduct(null);
            }
        }
    };

    const handleBarcodeChange = (e) => {
        setBarcode(e.target.value);
    };

    const handleBarcodeKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleBarcodeSubmit();
        }
    };

    const handleBarcodePaste = (e) => {
        setErrorMessage("กำลังดึงข้อมูลสินค้า...");
        e.preventDefault();
        const pastedData = e.clipboardData.getData("Text");
        setBarcode(pastedData);
        handleBarcodeSubmit(pastedData);
    };

    const handleResetBarcode = () => {
        setBarcode("");
        barcodeInputRef.current?.focus();
    };

    // ---------------- RIGHT SIDE (KEYPAD & MENU) ----------------
    const scanningMenuButtons = [
        { label: "กลับหน้าการขาย", path: "/employee/pos" },
        { label: "คืนสินค้า/คืนเงิน", path: "/employee/pos/void" },
        { label: "ออกจากระบบ", action: handleLogout },
        { label: "สินค้าอื่นๆ", action: () => alert("ฟีเจอร์สินค้าอื่นๆ ยังเขียนไม่เสร็จ") }
    ];

    const renderRightContent = () => {
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="บาร์โค้ด"
                        value={barcode}
                        onChange={handleBarcodeChange}
                        onKeyDown={handleBarcodeKeyDown}
                        style={{
                            padding: '10px',
                            flexGrow: 1,
                            marginRight: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
                    <div style={{ flex: 2 }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: '10px',
                            marginBottom: '10px'
                        }}>
                            {scanningMenuButtons.map((button, index) => (
                                <button
                                    key={index}
                                    onClick={button.action ? button.action : () => router.push(button.path || '')}
                                    style={{
                                        width: 'calc(50% - 10px)',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: '#333',
                                        color: 'white'
                                    }}
                                >
                                    {button.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '10px'
                        }}>
                            {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, 'ตกลง'].map((key, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (key === 'ตกลง') {
                                            handleBarcodeSubmit();
                                        } else {
                                            setBarcode(barcode + key.toString());
                                        }
                                    }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: key === 'ตกลง' ? 'green' : '#333',
                                        color: 'white'
                                    }}
                                >
                                    {key}
                                </button>
                            ))}
                            <button
                                onClick={handleResetBarcode}
                                style={{
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: 'red',
                                    color: 'white'
                                }}
                            >
                                รีเซ็ต
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // ---------------- LEFT SIDE (ENQUIRY DETAILS) ----------------
    // The product name is now on top, followed by the barcode and price.
    // If img_path is provided and the file exists in the public folder, it is displayed.
    const renderLeftContent = () => {
        return (
            <div>
                {errorMessage && (
                    <div style={{ color: 'red', marginBottom: '10px' }}>{errorMessage}</div>
                )}
                {product && (
                    <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
                        {/* Display product image if available.
                onError hides the image if the file doesn't exist in public */}
                        {product.img_path && (
                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                <img
                                    src={product.img_path}
                                    alt={product.name_th}
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}
                        {/* Product Name on top */}
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                            {product.name_th}
                        </div>
                        {/* Row: Barcode on left and price on right */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '1rem' }}>{product.barcode}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                {parseFloat(product.price).toFixed(2)} บาท
                            </div>
                        </div>
                        {/* Stock Info: Frontstore and Backstore */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                            <div>หน้าร้าน: {product.front_quantity}</div>
                            <div>หลังร้าน: {product.back_quantity}</div>
                        </div>
                        {/* Promotion Info */}
                        <div style={{ marginTop: '10px', fontSize: '1.2rem' }}>
                            โปรโมชั่น:{" "}
                            {product.is_bulk && product.single_price
                                ? `${parseFloat(product.single_price).toFixed(2)} บาท`
                                : "-"}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ---------------- FINAL RENDER ----------------
    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
            {/* Left Side: Enquiry Details */}
            <div style={{ width: '50%', padding: '20px', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
                {renderLeftContent()}
            </div>
            {/* Right Side: Keypad and Menu */}
            <div style={{ width: '50%', padding: '20px', overflowY: 'auto' }}>
                {renderRightContent()}
            </div>
        </div>
    );
};

export default EnquiryPage;
