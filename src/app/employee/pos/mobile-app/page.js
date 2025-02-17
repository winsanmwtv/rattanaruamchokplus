"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

// Helper function to get cookie by name
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
};

const MobilePosPage = () => {
    const router = useRouter();
    const empId = getCookie("emp_id");

    // Common states
    const [receiptId, setReceiptId] = useState("");
    const [itemList, setItemList] = useState([]); // Each item: { id, barcode, name_th, quantity, price }
    const [totalPrice, setTotalPrice] = useState(0);
    const [manualBarcode, setManualBarcode] = useState("");
    const [quantityInput, setQuantityInput] = useState(1);
    const [errorMessage, setErrorMessage] = useState("");

    // Camera and scanning states
    const [showCamera, setShowCamera] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);

    // Device selection states
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

    // Zoom state (default set to 2x)
    const [zoom, setZoom] = useState(2);

    // To prevent duplicate scans
    const [lastScanned, setLastScanned] = useState("");

    // Debug state for camera properties
    const [cameraDebug, setCameraDebug] = useState({});

    // Modes: "scan", "more", "payment", "cash", "thaiQR", "result"
    const [mode, setMode] = useState("scan");
    const [cashReceived, setCashReceived] = useState("");
    const [changeDue, setChangeDue] = useState(null);

    // Reference for the scanner container (to access the video element)
    const scannerRef = useRef(null);

    // ------------------ Enumerate and Select Video Devices ------------------
    useEffect(() => {
        // Request permission so that device labels are available.
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                stream.getTracks().forEach((track) => track.stop());
                return navigator.mediaDevices.enumerateDevices();
            })
            .then((devices) => {
                const allVideoDevices = devices.filter(
                    (device) => device.kind === "videoinput"
                );
                // Filter out front-facing devices based on label.
                let rearCameras = allVideoDevices.filter((device) => {
                    const label = device.label.toLowerCase();
                    return !label.includes("front") && !label.includes("selfie");
                });

                if (rearCameras.length === 0) rearCameras = allVideoDevices; // Fallback to all if none found

                setVideoDevices(rearCameras);
                setSelectedDeviceIndex(0);
            });
    }, []);

    // ------------------ Handle Barcode Scanning ------------------
    const handleScan = (barcode) => {
        if (!barcode || isWaiting || barcode === lastScanned) return;

        setIsWaiting(true);
        setLastScanned(barcode);

        // Simulate an API call or database lookup
        setTimeout(() => {
            const newItem = { barcode, name_th: "Test Product", quantity: 1, price: 100 };
            setItemList((prevList) => [...prevList, newItem]);
            setTotalPrice((prevTotal) => prevTotal + newItem.price);
            setIsWaiting(false);
        }, 1000);
    };

    const handleError = (err) => {
        console.error("Barcode Scan Error:", err);
    };

    // ------------------ Camera Selection ------------------
    const switchCamera = () => {
        setSelectedDeviceIndex((prevIndex) => (prevIndex + 1) % videoDevices.length);
    };

    // ------------------ Zoom Control ------------------
    const handleZoomChange = (e) => {
        setZoom(parseFloat(e.target.value));
    };

    // ------------------ Render ------------------
    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Mobile POS</h1>

            {showCamera ? (
                <div className="relative w-full max-w-md mx-auto">
                    <BarcodeScannerComponent
                        width={400}
                        height={300}
                        videoConstraints={{
                            deviceId: videoDevices[selectedDeviceIndex]?.deviceId,
                            zoom,
                        }}
                        onUpdate={(err, result) => {
                            if (result) handleScan(result.text);
                            if (err) handleError(err);
                        }}
                    />

                    {/* Camera Controls */}
                    <div className="mt-2 flex justify-between">
                        <button
                            onClick={switchCamera}
                            className="px-3 py-1 bg-blue-500 text-white rounded"
                        >
                            Switch Camera
                        </button>
                        <input
                            type="range"
                            min="1"
                            max="2"
                            step="0.1"
                            value={zoom}
                            onChange={handleZoomChange}
                            className="w-24"
                        />
                    </div>

                    {/* Debug Info */}
                    <div className="mt-2 text-sm bg-gray-200 p-2 rounded">
                        <p>Camera: {videoDevices[selectedDeviceIndex]?.label || "Unknown"}</p>
                        <p>Zoom: {zoom}x</p>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowCamera(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Start Scanner
                </button>
            )}

            {/* Scanned Items List */}
            <div className="mt-4">
                <h2 className="text-lg font-bold">Scanned Items</h2>
                {itemList.length === 0 ? (
                    <p>No items scanned yet.</p>
                ) : (
                    <ul>
                        {itemList.map((item, index) => (
                            <li key={index} className="border p-2 my-1">
                                {item.name_th} - {item.quantity}x - ฿{item.price}
                            </li>
                        ))}
                    </ul>
                )}
                <p className="font-bold">Total: ฿{totalPrice}</p>
            </div>
        </div>
    );
};

export default MobilePosPage;
