"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PosPage = () => {
    const router = useRouter();
    const barcodeInputRef = useRef(null);

    // State for receipt, scanned items, barcode input, etc.
    const [receiptId, setReceiptId] = useState('');
    const [lastScannedItem, setLastScannedItem] = useState(null);
    const [barcode, setBarcode] = useState("");
    const [itemList, setItemList] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [quantityInput, setQuantityInput] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // On mount, determine if mobile, focus input, and fetch receipt id
    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        barcodeInputRef.current?.focus();

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

        const handleEnter = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (barcode.trim() !== "") {
                    handleBarcodeSubmit();
                    setTimeout(() => barcodeInputRef.current?.focus(), 100);
                }
            }
        };

        window.addEventListener('keydown', handleEnter);
        return () => window.removeEventListener('keydown', handleEnter);
    }, [barcode]);

    // Update barcode state on input change
    const handleBarcodeChange = (e) => {
        setBarcode(e.target.value);
    };

    // When a barcode is submitted, call the product API to look up product details.
    // If the product is not found, show an error message without adding an item.
    const handleBarcodeSubmit = async () => {
        if (barcode.trim() !== "") {
            const quantityToUse = parseInt(quantityInput, 10) || 1;
            try {
                const res = await fetch(`/api/product/get?barcode=${barcode}`, { method: 'GET' });
                if (!res.ok) {
                    setErrorMessage("Product not found");
                    setTimeout(() => setErrorMessage(""), 3000); // Clear error after 3 seconds
                    setBarcode("");
                    setQuantityInput(1);
                    barcodeInputRef.current?.focus();
                    return;
                }
                const product = await res.json();
                const newItem = {
                    id: itemList.length + 1,
                    name_th: product.name_th,
                    quantity: quantityToUse,
                    price: parseFloat(product.price)
                };
                setLastScannedItem(newItem);
                setItemList([...itemList, newItem]);
                setBarcode("");
                setQuantityInput(1);
                barcodeInputRef.current?.focus();
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }
    };

    // Update total price whenever itemList changes
    useEffect(() => {
        const newTotal = itemList.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(newTotal);
    }, [itemList]);

    const handleResetBarcode = () => {
        setBarcode("");
        barcodeInputRef.current?.focus();
    };

    const handleQuantityInputChange = (e) => {
        setQuantityInput(e.target.value);
    };

    // Function to handle order submission
    const handleSubmitOrder = () => {
        console.log("Order Submitted:", {
            receiptId,
            items: itemList,
            totalPrice
        });
        // Expand with actual order submission logic (e.g., API call) as needed.
    };

    // Menu buttons (with some sample actions)
    const menuButtons = [
        { label: "เช็คราคาสินค้า", path: "/employee/enquiry" },
        { label: "คืนสินค้า (Void)", action: () => alert("Void Bill") },
        { label: "พักบิล", action: () => alert("Hold Bill") },
        { label: "ออกจากระบบ", action: () => {/* add logout logic if needed */} },
        { label: "เรียกรายการพักบิล", action: () => alert("Call Hold Bill") },
        { label: "ยกเลิกบิลนี้", action: () => setItemList([]) },
        { label: "สินค้าอื่นๆ", action: () => alert("Other Items") },
        {
            label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    จำนวน:
                    <input
                        type="number"
                        value={quantityInput}
                        onChange={handleQuantityInputChange}
                        style={{
                            padding: '5px',
                            width: '50px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            marginLeft: '5px',
                            marginRight: '5px',
                            color: 'black'
                        }}
                        min="1"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
                onClick={() => setQuantityInput(Math.max(1, parseInt(quantityInput, 10) || 1) + 1)}
                style={{
                    padding: '2px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: '#90EE90',
                    borderRadius: '3px 3px 0 0',
                    fontSize: '0.8rem',
                    width: '50px'
                }}
            >
              ▲
            </span>
                        <span
                            onClick={() => setQuantityInput(Math.max(1, (parseInt(quantityInput, 10) || 1) - 1))}
                            style={{
                                padding: '2px',
                                border: 'none',
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
            ),
            action: () => {}
        },
    ];

    // Render the list of items in the current order
    const renderItemList = () => (
        <div style={{ border: '1px solid #ccc', padding: '10px', height: isMobile ? 'calc(50vh - 150px)' : 'calc(50vh - 100px)', overflowY: 'auto' }}>
            {itemList.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '30px', textAlign: 'center', borderRadius: '50%', border: '1px solid black' }}>
                        {item.quantity}
                    </div>
                    <div style={{ marginLeft: '10px' }}>
                        {item.name_th}
                        {item.quantity > 1 && <span style={{ marginLeft: '5px' }}> (@{item.price.toFixed(2)})</span>}
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        {(item.price * item.quantity).toFixed(2)}
                    </div>
                </div>
            ))}
            {itemList.length === 0 && <div style={{ textAlign: 'center' }}>ไม่มีสินค้า</div>}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', overflow: 'hidden' }}>
            {/* LEFT PART */}
            <div style={{
                width: isMobile ? '100%' : '50%',
                padding: '20px',
                borderRight: isMobile ? 'none' : '1px solid #ccc',
                overflowY: 'auto',
                height: isMobile ? 'auto' : '100%'
            }}>
                {/* Display Receipt ID above the barcode input */}
                <div style={{marginBottom: '10px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold'}}>
                    รหัสใบเสร็จ: {receiptId}
                </div>
                {lastScannedItem && (
                    <div style={{marginBottom: '10px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                            <div style={{fontWeight: 'bold'}}>{lastScannedItem.name_th}</div>
                            <div>{lastScannedItem.price.toFixed(2)}</div>
                        </div>
                        <div>บาร์โค้ด: {barcode}</div>
                    </div>
                )}
                {renderItemList()}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px'
                }}>
                    {/* Price Module */}
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{fontSize: '0.8rem'}}>ราคารวม</span>
                            <span style={{fontSize: '1.5rem', marginLeft: '10px'}}>{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Button Module */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <button
                            onClick={() => {
                                handleSubmitOrder();
                                // Example of setting an error message (replace with your validation)
                                if (totalPrice <= 0) { // Example: Check if zero or negative
                                    setErrorMessage("ราคารวมต้องมากกว่า 0");
                                } else {
                                    setErrorMessage(null); // Clear any previous error
                                }
                            }}
                            style={{
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                padding: '10px',
                                borderRadius: '5px',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            ยืนยันการสั่งซื้อ
                        </button>
                        {errorMessage && (
                            <div style={{marginTop: '10px', color: 'red', fontWeight: 'bold', textAlign: 'right'}}>
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PART */}
            <div style={{
                width: isMobile ? '100%' : '50%',
                padding: '20px',
                overflowY: 'auto',
                height: isMobile ? 'auto' : '100%'
            }}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                    <input
                        type="text"
                        placeholder="บาร์โค้ด"
                        value={barcode}
                        onChange={handleBarcodeChange}
                        ref={barcodeInputRef}
                        style={{
                            padding: '10px',
                            flexGrow: 1,
                            marginRight: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>
                <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                    <div style={{flex: 2}}> {/* Left side: Menu Buttons (flex: 2) */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: '10px',
                            marginBottom: '10px'
                        }}>
                            {menuButtons.map((button, index) => (
                                <button
                                    key={index}
                                    onClick={button.action || (() => router.push(button.path || ''))}
                                    style={{
                                        width: 'calc(50% - 10px)', // Two columns (50% width)
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: '#333',
                                        color: 'white',
                                        ...(button.label === "คืนสินค้า (Void)" || button.label === "ออกจากระบบ" ? {backgroundColor: 'red'} : {})
                                    }}
                                >
                                    {button.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}> {/* Right side: Numpad */}
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px'}}>
                            {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, 'ตกลง'].map((key, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (key === 'ตกลง') {
                                            handleBarcodeSubmit();
                                        } else {
                                            setBarcode(barcode + key);
                                        }
                                    }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: key === 'ตกลง' ? 'green' : 'dark_aqua',
                                        color: 'white',
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
                                    color: 'white',
                                }}
                            >
                                รีเซ็ต
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosPage;
