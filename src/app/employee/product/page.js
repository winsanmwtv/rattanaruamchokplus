'use client';
import { useState, useEffect } from 'react';

export default function ProductPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    // For adding a new product – only the fields the user can input
    const [formData, setFormData] = useState({
        barcode: '',
        name_th: '',
        name_en: '',
        price: '',
    });
    // For editing a product
    const [editProduct, setEditProduct] = useState(null);
    const [editData, setEditData] = useState({
        name_th: '',
        name_en: '',
        price: '',
    });

    useEffect(() => {
        if (!showAddForm) {
            fetchProducts();
        }
    }, [showAddForm]);

    const fetchProducts = () => {
        fetch('/api/product')
            .then((res) => res.json())
            .then((data) => {
                setProducts(data);
                setLoading(false);
            });
    };

    // Toggle the add form
    const handleAddToggle = () => {
        setShowAddForm(!showAddForm);
        // Reset edit mode when toggling add form
        setEditProduct(null);
    };

    // Add form change handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Submit new product
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            // Other fields are hardcoded
            front_quantity: 0,
            back_quantity: 0,
            img_path: null,
            prod_type: null,
            is_bulk: 0,
            bulk_quantity_each: null,
            // single_barcode removed and promotion always 0
        };

        const res = await fetch('/api/product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setFormData({
                barcode: '',
                name_th: '',
                name_en: '',
                price: '',
            });
            setShowAddForm(false);
            setProducts([]); // Remove list once a new item is added
        } else {
            const errorData = await res.json();
            alert('Error: ' + errorData.error);
        }
    };

    // Delete a product
    const handleDelete = async (barcode) => {
        if (!confirm('คุณมั่นใจที่จะลบสินค้านี้ออกหรือไม่?')) return;
        const res = await fetch(`/api/product?barcode=${barcode}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            // Refresh list after deletion
            fetchProducts();
        } else {
            const errorData = await res.json();
            alert('Error: ' + errorData.error);
        }
    };

    // Start editing a product
    const handleEdit = (product) => {
        setEditProduct(product);
        setEditData({
            name_th: product.name_th,
            name_en: product.name_en,
            price: product.price,
        });
    };

    // Edit form change handler
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Save edited product
    const handleSave = async (barcode) => {
        const payload = {
            barcode,
            ...editData,
            price: parseFloat(editData.price),
        };
        const res = await fetch('/api/product', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            setEditProduct(null);
            fetchProducts();
        } else {
            const errorData = await res.json();
            alert('Error: ' + errorData.error);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setEditProduct(null);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>แก้ไขรายการสินค้า</h1>
            <button onClick={handleAddToggle} style={{ marginBottom: '20px' }}>
                {showAddForm ? 'Cancel' : 'เพิ่มรายการสินค้า'}
            </button>
            {showAddForm && (
                // Scrollable container for the add form
                <div
                    style={{
                        maxHeight: '300px',
                        overflow: 'auto',
                        marginBottom: '20px',
                        border: '1px solid #ddd',
                        padding: '10px',
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <input
                                type="text"
                                name="barcode"
                                placeholder="Barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="name_th"
                                placeholder="Name (TH)"
                                value={formData.name_th}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="name_en"
                                placeholder="Name (EN)"
                                value={formData.name_en}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                step="0.01"
                                name="price"
                                placeholder="Price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="submit" style={{ marginTop: '10px' }}>
                            Submit
                        </button>
                    </form>
                </div>
            )}
            {/* Render product list only when add form is not shown */}
            {!showAddForm && (
                <div
                    style={{
                        maxHeight: '500px',
                        overflow: 'auto',
                        marginTop: '20px',
                        marginBottom: '80px', // Increased bottom margin
                    }}
                >
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                minWidth: '800px',
                                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                            }}
                        >
                            <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    Barcode
                                </th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    ชื่อสินค้า
                                </th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    ชื่อสินค้า (อังกฤษ)
                                </th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    ราคา
                                </th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    สต็อกหน้าร้าน
                                </th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    สต็อกหลังร้าน
                                </th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    รายการ
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {products.map((product) => (
                                <tr key={product.barcode}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {product.barcode}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editProduct && editProduct.barcode === product.barcode ? (
                                            <input
                                                type="text"
                                                name="name_th"
                                                value={editData.name_th}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            product.name_th
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editProduct && editProduct.barcode === product.barcode ? (
                                            <input
                                                type="text"
                                                name="name_en"
                                                value={editData.name_en}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            product.name_en
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editProduct && editProduct.barcode === product.barcode ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="price"
                                                value={editData.price}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            product.price
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {product.front_quantity}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {product.back_quantity}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editProduct && editProduct.barcode === product.barcode ? (
                                            <>
                                                <button
                                                    onClick={() => handleSave(product.barcode)}
                                                    style={{ marginRight: '5px' }}
                                                >
                                                    บันทึก
                                                </button>
                                                <button onClick={handleCancelEdit}>ยกเลิก</button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    style={{ marginRight: '5px' }}
                                                >
                                                    แก้ไข
                                                </button>
                                                <button onClick={() => handleDelete(product.barcode)}>
                                                    ลบ
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
