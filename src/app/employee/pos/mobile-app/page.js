"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import react-webcam to display the camera preview.
const Webcam = dynamic(() => import('react-webcam'), { ssr: false });

const MobilePosPage = () => {
    const router = useRouter();
    const [receiptId, setReceiptId] = useState('');
    const [lastScannedItem, setLastScannedItem] = useState(null);
    const [itemList, setItemList] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [manualBarcode, setManualBarcode] = useState('');
    const [quantityInput, setQuantityInput] = useState(1);
    const [showCamera, setShowCamera] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Fetch receipt id on mount.
    useEffect(() => {
        const fetchReceiptId = async () => {
            try {
                const res = await fetch('/api/receipt/generate', { method: 'GET' });
                if (!res.ok) {
                    console.error('Error fetching receipt id');
                    return;
                }
                const data = await res.json();
                setReceiptId(data.receipt_id);
            } catch (error) {
                console.error('Error fetching receipt id:', error);
            }
        };
        fetchReceiptId();
    }, []);

    // Update total price when itemList changes.
    useEffect(() => {
        const newTotal = itemList.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(newTotal);
    }, [itemList]);

    // Calculate total quantity.
    const totalQuantity = itemList.reduce((sum, item) => sum + item.quantity, 0);

    // Enable the camera by requesting permission from the browser.
    const handleEnableCamera = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            setShowCamera(true);
        } catch (err) {
            console.error("Error enabling camera:", err);
        }
    };

    // Dummy handler: simulate a camera scan when "Capture Barcode" is tapped.
    const handleCameraCapture = async () => {
        const simulatedBarcode = "1234567890";
        console.log("Camera scanned barcode:", simulatedBarcode);
        await handleBarcodeSubmit(simulatedBarcode);
    };

    // Submit a barcode (from camera capture or manual input) and log the scanned item.
    const handleBarcodeSubmit = async (barcodeValue) => {
        if (barcodeValue.trim() !== "") {
            try {
                const res = await fetch(`/api/product/get?barcode=${barcodeValue}`, { method: 'GET' });
                if (!res.ok) {
                    setErrorMessage("Product not found");
                    setTimeout(() => setErrorMessage(""), 3000);
                    return;
                }
                const product = await res.json();
                const newItem = {
                    id: itemList.length + 1,
                    name_th: product.name_th,
                    quantity: parseInt(quantityInput, 10) || 1,
                    price: parseFloat(product.price)
                };
                console.log("Scanned item:", newItem);
                setLastScannedItem(newItem);
                setItemList([...itemList, newItem]);
                setManualBarcode('');
                setQuantityInput(1);
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }
    };

    // Manual input submit handler.
    const handleManualSubmit = async () => {
        await handleBarcodeSubmit(manualBarcode);
    };

    // Trigger submission when the Enter key is pressed.
    const handleManualKeyDown = async (e) => {
        if (e.key === 'Enter') {
            await handleManualSubmit();
        }
    };

    // Handlers for quantity input changes and up/down arrow clicks.
    const handleQuantityInputChange = (e) => {
        setQuantityInput(e.target.value);
    };

    const increaseQuantity = () => {
        setQuantityInput((prev) => Math.max(1, parseInt(prev, 10) || 1) + 1);
    };

    const decreaseQuantity = () => {
        setQuantityInput((prev) => Math.max(1, (parseInt(prev, 10) || 1) - 1));
    };

    // Dummy order submission handler.
    const handleSubmitOrder = () => {
        console.log("Order Submitted:", {
            receiptId,
            items: itemList,
            totalPrice
        });
    };

    // Define the 8 menu buttons. Void Bill and Logout buttons are styled red.
    const menuButtons = [
        { label: "เช็คราคาสินค้า", path: "/employee/enquiry" },
        { label: "คืนสินค้า (Void)", action: () => alert("Void Bill"), style: { backgroundColor: 'red' } },
        { label: "พักบิล", action: () => alert("Hold Bill") },
        { label: "ออกจากระบบ", action: () => { /* logout logic */ }, style: { backgroundColor: 'red' } },
        { label: "เรียกรายการพักบิล", action: () => alert("Call Hold Bill") },
        { label: "ยกเลิกบิลนี้", action: () => setItemList([]) },
        { label: "สินค้าอื่นๆ", action: () => alert("Other Items") },
    ];

    // When showMenu is true, collapse everything else and show only the menu.
    if (showMenu) {
        return (
            <div style={{ height: '100vh', overflowY: 'auto', padding: '20px', textAlign: 'center' }}>
                <button
                    onClick={() => setShowMenu(false)}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#333',
                        color: 'white',
                        cursor: 'pointer',
                        marginBottom: '20px'
                    }}
                >
                    Hide Menu
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                    {menuButtons.map((button, index) => (
                        <button
                            key={index}
                            onClick={button.action || (() => router.push(button.path || ''))}
                            style={{
                                flex: '1 1 calc(50% - 10px)',
                                padding: '10px',
                                borderRadius: '5px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: button.style?.backgroundColor || '#333',
                                color: 'white'
                            }}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px' }}>
            {/* Top Bar with Show Menu Button */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <button
                    onClick={() => setShowMenu(true)}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#333',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Show Menu
                </button>
            </div>

            {/* Receipt ID */}
            <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                รหัสใบเสร็จ: {receiptId}
            </div>

            {/* Camera Section */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                {showCamera ? (
                    <>
                        <Webcam
                            audio={false}
                            videoConstraints={{ facingMode: 'environment' }}
                            style={{ width: '100%', maxWidth: '300px', height: '200px', objectFit: 'cover', margin: '0 auto' }}
                        />
                        <button
                            onClick={handleCameraCapture}
                            style={{
                                marginTop: '10px',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                border: 'none',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Capture Barcode
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleEnableCamera}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Enable Camera
                    </button>
                )}
            </div>

            {/* Manual Barcode Input and Quantity Adder */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <input
                    type="text"
                    placeholder="Enter barcode manually"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyDown={handleManualKeyDown}
                    style={{
                        padding: '10px',
                        width: '60%',
                        borderRadius: '5px',
                        border: '1px solid #ccc'
                    }}
                />
                <button
                    onClick={handleManualSubmit}
                    style={{
                        marginLeft: '10px',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    ตกลง
                </button>
                {/* Quantity Adder */}
                <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '5px' }}>
                    <span style={{ padding: '5px' }}>จำนวน:</span>
                    <input
                        type="number"
                        value={quantityInput}
                        onChange={handleQuantityInputChange}
                        style={{
                            padding: '5px',
                            width: '50px',
                            textAlign: 'center',
                            border: 'none'
                        }}
                        min="1"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
                onClick={increaseQuantity}
                style={{
                    padding: '2px',
                    cursor: 'pointer',
                    backgroundColor: '#90EE90',
                    borderRadius: '3px 3px 0 0',
                    fontSize: '0.8rem'
                }}
            >
              ▲
            </span>
                        <span
                            onClick={decreaseQuantity}
                            style={{
                                padding: '2px',
                                cursor: 'pointer',
                                backgroundColor: '#FF6347',
                                borderRadius: '0 0 3px 3px',
                                fontSize: '0.8rem'
                            }}
                        >
              ▼
            </span>
                    </div>
                </div>
            </div>

            {/* Latest Scanned Item */}
            {lastScannedItem && (
                <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <div>{lastScannedItem.name_th}</div>
                    <div>ราคา: {lastScannedItem.price.toFixed(2)}</div>
                    <div>จำนวน: {lastScannedItem.quantity}</div>
                </div>
            )}

            {/* Total Price and Quantity */}
            <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.5rem' }}>
                รวม: {totalPrice.toFixed(2)} ({totalQuantity} items)
            </div>

            {/* Submit Order Button */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                    onClick={handleSubmitOrder}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    ตกลง
                </button>
            </div>
        </div>
    );
};

export default MobilePosPage;
