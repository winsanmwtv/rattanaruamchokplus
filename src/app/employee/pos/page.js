"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const paymentGateway = '1103400083485';
const paymentGatewayName = 'พงศ์ศิริ เลิศพงษ์ไทย';

// Helper to get a cookie value by name
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const PosPage = () => {

    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogout = () => {
        document.cookie = "emp_id=; path=/; max-age=0";
        document.cookie = "firstName=; path=/; max-age=0";
        document.cookie = "lastName=; path=/; max-age=0";
        document.cookie = "employeeType=; path=/; max-age=0";
        document.cookie = "avatarUrl=; path=/; max-age=0";

        setUser(null);
        setIsLoggedIn(false);
        router.push("/login");
    };

    const printReceipt = () => {
        // Get the receipt content
        const printContents = document.getElementById("receipt-print").innerHTML;
        // Open a new window
        const printWindow = window.open('', '', 'width=600,height=600');
        // Write the receipt content into the new window, along with basic styling
        printWindow.document.write(`
        <html>
            <head>
                <title>Print Receipt</title>
                <style>
                    body {
                        font-family: monospace;
                        font-size: 14px;
                        margin: 20px;
                    }
                </style>
            </head>
            <body>
                ${printContents}
            </body>
        </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        // Trigger the print dialog
        printWindow.print();
        // Close the window after printing
        printWindow.close();
    };



    const handleBarcodePaste = (e) => {
        setErrorMessage("กำลังติดต่อกับระบบฐานข้อมูล CityRetails... | อาจใช้เวลาสักครู่");
        e.preventDefault(); // Prevent the default paste behavior
        const pastedData = e.clipboardData.getData('Text'); // Get pasted data
        setBarcode(pastedData); // Update the barcode state
        handleBarcodeSubmit(pastedData); // Automatically submit the pasted barcode
        setErrorMessage("");
    };


    const handleBarcodeInput = (e) => {
        const newValue = e.target.value;

        // Detect paste: If more than one character appears instantly
        if (newValue.length > barcode.length + 1) {
            setBarcode(newValue);
            setTimeout(() => handleBarcodeSubmit(), 0); // Auto-submit after paste
        } else {
            setBarcode(newValue); // Normal typing updates
        }
    };

    let justAMoneyIWriteMyself = "";

    const router = useRouter();
    const barcodeInputRef = useRef(null);
    const cashInputRef = useRef(null);

    // Common states
    const [receiptId, setReceiptId] = useState('');
    const [itemList, setItemList] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [changeDue, setChangeDue] = useState(null);

    const [realCash, setRealCash] = useState('')

    // Scanning Mode states
    const [barcode, setBarcode] = useState("");
    const [quantityInput, setQuantityInput] = useState(1);

    // Payment Mode states
    const [isPaymentMode, setIsPaymentMode] = useState(false);
    const [cashReceived, setCashReceived] = useState("");
    const [paymentType, setPaymentType] = useState("Cash"); // "Cash" or "Thai QR" (or "Coupon")

    // Get emp_id from cookie (assumes cookie name "emp_id")
    const empId = getCookie("emp_id");

    // ---------------- API CALL FUNCTIONS ----------------

    // For Cash Payment: verify cash input, compute change, and save transaction.
    const handleCashPayment = async () => {

        setErrorMessage("กำลังติดต่อกับระบบฐานข้อมูล CityRetails... | อาจใช้เวลาสักครู่");

        console.log(cashReceived);

        const cash = parseFloat(cashReceived) || 0;

        justAMoneyIWriteMyself = cash;

        if (cash < totalPrice) {
            setErrorMessage("เงินที่รับมาน้อยกว่าราคารวม");
            return;
        }
        const change = cash - totalPrice;
        setRealCash(cash.toFixed(2));

        try {
            let trans_id;

            const transRes = await fetch('/api/transaction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emp_id: empId,
                    branch_id: 9000,
                    total_price: totalPrice,
                    status: 'completed',
                    payment_type: "Cash"
                })
            });

            if (!transRes.ok) {
                const errorData = await transRes.json();
                setErrorMessage(errorData.error || "Transaction creation failed");
                return; // Stop further processing
            }

            const transData = await transRes.json();
            trans_id = transData.trans_id;

            const receiptRes = await fetch('/api/receipt/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receipt_id: receiptId,
                    trans_id: trans_id,
                    branch_id: 9000,
                    issue_date: new Date().toISOString().slice(0, 10)
                })
            });

            if (!receiptRes.ok) {
                const errorData = await receiptRes.json();
                setErrorMessage(errorData.error || "Receipt creation failed");
                return; // Stop further processing
            }


            for (const item of itemList) {
                const receiptItemRes = await fetch('/api/receipt_item/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receipt_id: receiptId,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    })
                });

                if (!receiptItemRes.ok) {
                    const errorData = await receiptItemRes.json();
                    setErrorMessage(errorData.error || `Receipt item creation failed for ${item.barcode}`);
                    return; // Stop further processing
                }

                const transItemRes = await fetch('/api/transaction_item/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trans_id: trans_id,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    })
                });

                if (!transItemRes.ok) {
                    const errorData = await transItemRes.json();
                    setErrorMessage(errorData.error || `Transaction item creation failed for ${item.barcode}`);
                    return; // Stop further processing
                }


                const stockRes = await fetch('/api/product/updateStock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        branch_id: 9000
                    })
                });

                if (!stockRes.ok) {
                    const errorData = await stockRes.json();
                    setErrorMessage(errorData.error || `Stock update failed for product ${item.barcode}`);
                    return; // Stop further processing
                }
            }

            const shiftRes = await fetch('/api/shift/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString().slice(0, 10),
                    emp_id: empId,
                    increment: totalPrice
                })
            });

            if (!shiftRes.ok) {
                const errorData = await shiftRes.json();
                setErrorMessage(errorData.error || "Shift update failed");
                return; // Stop further processing
            }

            setChangeDue(change.toFixed(2));
            setErrorMessage("");
            setCashReceived("");
            cashInputRef.current?.focus();

        } catch (error) {
            console.error("Error processing Cash payment:", error);
            setErrorMessage(error.message || "Error processing payment");
        }
    };


    // For Thai QR Payment: save transaction with payment type "Thai QR"
    const handleThaiQRPayment = async () => {

        setErrorMessage("กำลังติดต่อกับระบบฐานข้อมูล CityRetails... | อาจใช้เวลาสักครู่");

        try {
            let trans_id;

            const transRes = await fetch('/api/transaction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emp_id: empId,
                    branch_id: 9000,
                    total_price: totalPrice,
                    status: 'completed',
                    payment_type: "Thai QR"
                })
            });

            if (!transRes.ok) {
                const errorData = await transRes.json();
                setErrorMessage(errorData.error || "Transaction creation failed");
                return;
            }

            const transData = await transRes.json();
            trans_id = transData.trans_id;

            const receiptRes = await fetch('/api/receipt/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receipt_id: receiptId,
                    trans_id: trans_id,
                    branch_id: 9000,
                    issue_date: new Date().toISOString().slice(0, 10)
                })
            });

            if (!receiptRes.ok) {
                const errorData = await receiptRes.json();
                setErrorMessage(errorData.error || "Receipt creation failed");
                return;
            }

            for (const item of itemList) {
                const receiptItemRes = await fetch('/api/receipt_item/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receipt_id: receiptId,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    })
                });

                if (!receiptItemRes.ok) {
                    const errorData = await receiptItemRes.json();
                    setErrorMessage(errorData.error || `Receipt item creation failed for ${item.barcode}`);
                    return;
                }

                const transItemRes = await fetch('/api/transaction_item/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trans_id: trans_id,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    })
                });

                if (!transItemRes.ok) {
                    const errorData = await transItemRes.json();
                    setErrorMessage(errorData.error || `Transaction item creation failed for ${item.barcode}`);
                    return;
                }

                const stockRes = await fetch('/api/product/updateStock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        branch_id: 9000
                    })
                });

                if (!stockRes.ok) {
                    const errorData = await stockRes.json();
                    setErrorMessage(errorData.error || `Stock update failed for product ${item.barcode}`);
                    return;
                }
            }

            // const shiftRes = await fetch('/api/shift/update', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         date: new Date().toISOString().slice(0, 10),
            //         emp_id: empId,
            //         increment: totalPrice
            //     })
            // });



            setErrorMessage("การทำรายการเสร็จสิ้น");

            setChangeDue('0.00');

        } catch (error) {
            console.error("Error processing ThaiQR payment:", error);
            setErrorMessage(error.message || "Error processing payment");
        }
    };

    // ---------------- USE EFFECT & CALCULATIONS ----------------

    useEffect(() => {
        if (window.innerWidth <= 768) {
            router.push('/employee/pos/mobile-app');
            return;
        }
        // Focus on the proper input based on mode.
        if (!isPaymentMode) {
            barcodeInputRef.current?.focus();
        } else {
            cashInputRef.current?.focus();
        }



        // Fetch a new receipt id.
        const fetchReceiptId = async () => {
            try {

                // const receiptRes = await fetch('/api/receipt/create', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({
                //         receipt_id: receiptId,
                //         trans_id: trans_id,
                //         branch_id: 9000,
                //         issue_date: new Date().toISOString().slice(0, 10)
                //     })
                // });

                const res = await fetch('/api/receipt/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                             staffId: empId
                         })
                });
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
    }, [router, isPaymentMode]);

    useEffect(() => {
        const newTotal = itemList.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(newTotal);
    }, [itemList]);

    // ---------------- Scanning Mode Handlers ----------------

    const handleBarcodeChange = (e) => {
        setBarcode(e.target.value);
    };

    const handleBarcodeSubmit = async (submittedBarcode) => {
        setErrorMessage("กำลังติดต่อกับระบบฐานข้อมูล CityRetails... | อาจใช้เวลาสักครู่");
        const barcodeToSubmit = submittedBarcode || barcode;
        if (barcodeToSubmit.trim() !== "") {
            const quantityToUse = parseInt(quantityInput, 10) || 1;
            try {
                const res = await fetch(`/api/product/get?barcode=${barcodeToSubmit}`, { method: 'GET' });
                if (!res.ok) {
                    setErrorMessage("Product not found");
                    setTimeout(() => setErrorMessage(""), 3000);
                    setBarcode("");
                    setQuantityInput(1);
                    barcodeInputRef.current?.focus();
                    return;
                }
                const product = await res.json();
                const newItem = {
                    id: itemList.length + 1,
                    barcode: barcodeToSubmit,
                    name_th: product.name_th,
                    quantity: quantityToUse,
                    price: parseFloat(product.price)
                };
                setItemList([...itemList, newItem]);
                setBarcode("");
                setQuantityInput(1);
                barcodeInputRef.current?.focus();
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }
        setErrorMessage("");
    };


    const handleResetBarcode = () => {
        setBarcode("");
        barcodeInputRef.current?.focus();
    };

    // Transition to Payment Mode (triggered by "รวมยอด" button)
    const handleEnterPaymentMode = () => {
        if (totalPrice <= 0) {
            setErrorMessage("ราคารวมต้องมากกว่า 0");
            return;
        }
        setErrorMessage("");
        setIsPaymentMode(true);
        setPaymentType("Cash"); // Default to Cash
        setTimeout(() => cashInputRef.current?.focus(), 100);
    };

    // ---------------- Payment Mode Handlers ----------------

    // For numeric keypad in Payment Mode (cash input remains unchanged)
    const handleCashInput = (value) => {
        if (value === 'ตกลง') return;
        setCashReceived(cashReceived + value.toString());
    };

    const handleResetCashInput = () => {
        setCashReceived("");
        cashInputRef.current?.focus();
    };

    // ---------------- MENU BUTTON DEFINITIONS ----------------

    // Scanning Mode: Original 8 buttons with quantity control.
    const scanningMenuButtons = [
        { label: "เช็คราคาสินค้า", path: "/employee/enquiry" },
        { label: "คืนสินค้า (Void)", path: "/employee/pos/void" },
        { label: "พักบิล", action: () => alert("ฟีเจอร์พักบิลยังเขียนไม่เสร็จ") },
        { label: "ออกจากระบบ", action: () => handleLogout() },
        { label: "เรียกรายการพักบิล", action: () => alert("ฟีเจอร์เรียกพักบิลยังเขียนไม่เสร็จ") },
        { label: "ยกเลิกบิลนี้", action: () => setItemList([]) },
        { label: "สินค้าอื่นๆ", action: () => alert("ฟีเจอร์สินค้าอื่นๆ ยังเขียนไม่เสร็จ") },
        {
            label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    จำนวน:
                    <input
                        type="number"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
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

    const handleCashReceivedKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission (if applicable)
            handleCashPayment(); // Call your cash payment function
        }
    };

    const handleBarcodeKeyDown = (event) => {
        if (event.key === "Enter") { // Check if Enter key was pressed
            event.preventDefault(); // Prevent form submission if inside a form
            handleBarcodeSubmit();    // Call your submit handler function
        }
    };

    // Payment Mode: 4 buttons (remove cancel item button)
    const paymentMenuButtons = [
        { label: "Cash", action: handleCashPayment },
        { label: "Thai QR", action: () => setPaymentType("Thai QR") },
        { label: "Coupon", action: () => alert("Coupon payment not available") },
        { label: "Add Item", action: () => { setIsPaymentMode(false); setCashReceived(""); setErrorMessage(""); } }
    ];

    // ---------------- RENDER FUNCTIONS ----------------

    // Left Side: In scanning mode, show receipt details and item list.
    // In Payment Mode, if paymentType is "Thai QR", show the PromptPay QR image and a "Submit ThaiQR" button.
    const renderLeftContent = () => (
        <div>
            {changeDue !== null ? (
                <div style={{textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', padding: '20px'}}>
                    <div style={{fontSize: '1.2rem'}}> {/* Smaller receipt ID */}
                        รหัสใบเสร็จ: {receiptId}
                    </div>
                    {paymentType === "Cash" ? <div>เงินทอน: {changeDue}</div> : <div></div>}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                        }}
                    >
                        ทำรายการอื่นต่อ
                    </button>
                </div>
            ) : (
                <div>
                    <div style={{marginBottom: '10px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        รหัสใบเสร็จ: {receiptId}
                    </div>

                    {isPaymentMode && paymentType === "Thai QR" ? (
                        <div style={{textAlign: 'center'}}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column', // Align items vertically
                                justifyContent: 'center', // Center vertically
                                alignItems: 'center'      // Center horizontally
                            }}>
                                <img
                                    src={`https://promptpay.io/${paymentGateway}/${totalPrice}.png`}
                                    alt="PromptPay QR Code"
                                    style={{maxWidth: '100%', maxHeight: '100%'}}
                                />
                                <div>{paymentGatewayName}</div>
                                {/* No need for template literals here */}
                                <div>{paymentGateway}</div>
                                {/* No need for template literals here */}
                            </div>
                            <button
                                onClick={handleThaiQRPayment}
                                style={{
                                    marginTop: '10px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                ยืนยันการทำรายการ
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            border: '1px solid #ccc',
                            padding: '10px',
                            height: 'calc(50vh - 100px)',
                            overflowY: 'auto'
                        }}>
                            {itemList.length > 0 ? itemList.map(item => (
                                <div key={item.id} style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
                                    <div style={{
                                        width: '30px',
                                        textAlign: 'center',
                                        borderRadius: '50%',
                                        border: '1px solid black'
                                    }}>
                                        {item.quantity}
                                    </div>
                                    <div style={{ marginLeft: '10px' }}>
                                        {item.name_th}
                                        {item.quantity > 1 &&
                                            <span style={{ marginLeft: '5px' }}> (@{item.price.toFixed(2)})</span>}
                                    </div>
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                        {(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            )) : <div style={{ textAlign: 'center' }}>ไม่มีสินค้า</div>}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem' }}>ราคารวม</span>
                            <span style={{ fontSize: '1.5rem' }}>{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    {errorMessage && (
                        <div style={{ marginTop: '10px', color: 'red', fontWeight: 'bold', textAlign: 'right' }}>
                            {errorMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // Right Side: Render different UI for scanning mode vs. payment mode.
    const renderRightContent = () => {
        if (changeDue !== null) { // Show receipt
            return (
                <div style={{
                    position: 'relative', // Container for absolute positioning
                    border: '1px solid #ccc',
                    padding: '10px',
                    height: '90%',
                    overflowY: 'auto',
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                }}>
                    {/* Smaller Print Button in the top-right corner */}
                    <button
                        onClick={printReceipt}
                        style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            width: '50px'
                        }}
                    >
                        Print
                    </button>

                    {/* Receipt Content Wrapped for Printing */}
                    <div id="receipt-print">
                        <div style={{textAlign: 'center', marginBottom: '10px'}}>
                            ร้าน รัตนารวมโชค ({9000})<br/>
                            สาขา {"พระจอมเกล้าพระนครเหนือ" || "ไม่ระบุ"}<br/>
                            {new Date().toLocaleDateString('th-TH', { // ส่วนที่แก้ไข
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                timeZone: 'Asia/Bangkok' // เพิ่ม timeZone
                            })} | {new Date().toLocaleTimeString('th-TH', { // ส่วนที่แก้ไข
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                            timeZone: 'Asia/Bangkok' // เพิ่ม timeZone
                        })}<br/><br/>
                            Bill {receiptId} | User {empId}
                        </div>

                        <div style={{marginBottom: '10px'}}>
                            {itemList.map(item => (
                                <div key={item.id} style={{display: 'flex', marginBottom: '5px'}}>
                                    <div style={{width: '40px', textAlign: 'right'}}>{item.quantity}</div>
                                    <div style={{flexGrow: 1, marginLeft: '10px'}}>
                                        {item.name_th}
                                        {item.quantity > 1 &&
                                            <span style={{marginLeft: '5px'}}>(@{item.price.toFixed(2)})</span>}
                                    </div>
                                    <div style={{
                                        width: '60px',
                                        textAlign: 'right'
                                    }}>{(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{borderTop: '1px dashed #ccc', paddingTop: '10px', marginBottom: '10px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                <div>ยอดรวม</div>
                                <div>{totalPrice.toFixed(2)}</div>
                            </div>

                            {paymentType === "Cash" ? (
                                <>
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                        <div>รับเงินมา</div>
                                        <div>{realCash}</div>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                        <div>เงินทอน</div>
                                        <div>{changeDue}</div>
                                    </div>
                                </>
                            ) : (
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <div>สแกนจ่าย</div>
                                    <div>{totalPrice.toFixed(2)}</div>
                                </div>
                            )}
                        </div>

                        <div style={{textAlign: 'center'}}>
                            *** ขอบคุณที่ใช้บริการ ***
                        </div>
                    </div>
                </div>
            );
        } else if (!isPaymentMode && changeDue === null) {
            // Scanning Mode: Barcode input, original 8-menu buttons, numpad, and an extra "รวมยอด" button below the numpad.
            return (
                <>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                        <input
                            type="text"
                            placeholder="บาร์โค้ด"
                            value={barcode}
                            onChange={handleBarcodeChange}
                            ref={barcodeInputRef}
                            onKeyDown={handleBarcodeKeyDown} // Handles Enter key submission
                            onPaste={handleBarcodePaste} // Auto-submit on paste
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
                        <div style={{flex: 2}}>
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
                                        onClick={button.action || (() => router.push(button.path || ''))}
                                        style={{
                                            width: 'calc(50% - 10px)',
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
                        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
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
                            {/* Extra "รวมยอด" button below the numpad */}
                            <button
                                onClick={handleEnterPaymentMode}
                                style={{
                                    marginTop: '10px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                รวมยอด
                            </button>
                        </div>
                    </div>
                </>
            );
        } else {
            // Payment Mode: Cash input field, payment menu, numeric keypad remains unchanged.
            return (
                <>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                        <input
                            type="text"
                            placeholder="เงินที่รับมา"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            ref={cashInputRef}
                            onKeyDown={handleCashReceivedKeyDown} // Add this line
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
                        <div style={{flex: 2}}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '10px',
                                marginBottom: '10px'
                            }}>
                                {paymentMenuButtons.map((button, index) => (
                                    <button
                                        key={index}
                                        onClick={button.action}
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
                                {[7,8,9,4,5,6,1,2,3,0,'.'].map((key, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (key === 'ตกลง') return;
                                            else handleCashInput(key);
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
                                    onClick={handleResetCashInput}
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
                            {/* No extra submit button here as payment is triggered by the Cash or Thai QR buttons */}
                        </div>
                    </div>
                </>
            );
        }
    };

    // ---------------- FINAL RENDER ----------------

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
            {/* Left Side: Receipt details or ThaiQR QR code */}
            <div style={{ width: '50%', padding: '20px', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
                {renderLeftContent()}
            </div>
            {/* Right Side: Scanning Mode vs. Payment Mode UI */}
            <div style={{ width: '50%', padding: '20px', overflowY: 'auto' }}>
                {renderRightContent()}
            </div>
        </div>
    );
};

export default PosPage;
