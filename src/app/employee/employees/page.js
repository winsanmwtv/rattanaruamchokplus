'use client';
import { useState, useEffect } from 'react';

// Helper: Format date for display as "dd MMM yyyy"
function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// Helper: Format date for DB as "YYYY-MM-DD HH:MM:SS"
function formatForDB(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function EmployeePage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    // Add form data (no need to input emp_id, startwork, branch, img_path, or password)
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        role: '1', // default: พนักงานหน้าร้าน
        tel_no: '',
        birthdate: '',
        salary: '',
    });
    // When editing, we store the employee object in editEmployee
    const [editEmployee, setEditEmployee] = useState(null);

    useEffect(() => {
        if (!showAddForm) {
            fetchEmployees();
        }
    }, [showAddForm]);

    const fetchEmployees = () => {
        fetch('/api/employee')
            .then((res) => res.json())
            .then((data) => {
                setEmployees(data);
                setLoading(false);
            });
    };

    const handleAddToggle = () => {
        setShowAddForm(!showAddForm);
        setEditEmployee(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            salary: parseInt(formData.salary, 10),
        };
        const res = await fetch('/api/employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            setFormData({
                firstname: '',
                lastname: '',
                role: '1',
                tel_no: '',
                birthdate: '',
                salary: '',
            });
            setShowAddForm(false);
            setEmployees([]);
        } else {
            const errorData = await res.json();
            alert('Error: ' + errorData.error);
        }
    };

    const handleDelete = async (emp_id) => {
        if (!confirm('คุณมั่นใจที่จะไล่พนักงานคนนี้ออกหรือไม่?')) return;
        const res = await fetch(`/api/employee?emp_id=${emp_id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchEmployees();
        } else {
            const errorData = await res.json();
            alert('Error: ' + errorData.error);
        }
    };

    // When editing, use the employee object (with password cleared)
    const handleEdit = (employee) => {
        setEditEmployee({ ...employee, password: '' });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditEmployee((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (emp_id) => {
        // Retrieve the original employee record so that startwork and birthdate remain unchanged.
        const original = employees.find((e) => e.emp_id === emp_id);
        const payload = {
            emp_id,
            firstname: editEmployee.firstname,
            lastname: editEmployee.lastname,
            role: editEmployee.role,
            tel_no: editEmployee.tel_no,
            // Format dates for DB (as timestamp)
            startwork: formatForDB(original.startwork),
            birthdate: formatForDB(original.birthdate),
            salary: parseInt(editEmployee.salary, 10),
            branch: editEmployee.branch,
            img_path: editEmployee.img_path,
            password: editEmployee.password,
        };
        const res = await fetch('/api/employee', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            setEditEmployee(null);
            fetchEmployees();
        } else {
            const errorData = await res.json();
            alert('Error: ' + errorData.error);
        }
    };

    const handleCancelEdit = () => {
        setEditEmployee(null);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>จัดการพนักงาน</h1>
            <button onClick={handleAddToggle} style={{ marginBottom: '20px' }}>
                {showAddForm ? 'Cancel' : 'เพิ่มพนักงานใหม่'}
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
                                name="firstname"
                                placeholder="First Name"
                                value={formData.firstname}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="lastname"
                                placeholder="Last Name"
                                value={formData.lastname}
                                onChange={handleChange}
                                required
                            />
                            <select name="role" value={formData.role} onChange={handleChange} required>
                                <option value="1">พนักงานหน้าร้าน</option>
                                <option value="2">ผู้จัดการร้าน</option>
                                <option value="3">พนักงานฝ่าย IT</option>
                                <option value="4">เจ้าของร้าน</option>
                            </select>
                            <input
                                type="text"
                                name="tel_no"
                                placeholder="Phone Number (9-10 digits)"
                                value={formData.tel_no}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="date"
                                name="birthdate"
                                placeholder="Birth Date"
                                value={formData.birthdate}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="salary"
                                placeholder="Salary"
                                value={formData.salary}
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
            {/* Render employee list only when add form is not shown */}
            {!showAddForm && (
                <div
                    style={{
                        maxHeight: '500px',
                        overflow: 'auto',
                        marginTop: '20px',
                        marginBottom: '80px',
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
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>รหัสพนักงาน</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>ชื่อ</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>นามสกุล</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>ตำแหน่ง</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>เบอร์โทรศัพท์</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>วันที่เริ่มงาน</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>วันเกิด</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>เงินเดือน</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>สาขา</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>รายการ</th>
                            </tr>
                            </thead>
                            <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.emp_id}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp.emp_id}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editEmployee && editEmployee.emp_id === emp.emp_id ? (
                                            <input
                                                type="text"
                                                name="firstname"
                                                value={editEmployee.firstname}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            emp.firstname
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editEmployee && editEmployee.emp_id === emp.emp_id ? (
                                            <input
                                                type="text"
                                                name="lastname"
                                                value={editEmployee.lastname}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            emp.lastname
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editEmployee && editEmployee.emp_id === emp.emp_id ? (
                                            <select
                                                name="role"
                                                value={editEmployee.role}
                                                onChange={handleEditChange}
                                            >
                                                <option value="1">พนักงานหน้าร้าน</option>
                                                <option value="2">ผู้จัดการร้าน</option>
                                                <option value="3">พนักงานฝ่าย IT</option>
                                                <option value="4">เจ้าของร้าน</option>
                                            </select>
                                        ) : (
                                            emp.role
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editEmployee && editEmployee.emp_id === emp.emp_id ? (
                                            <input
                                                type="text"
                                                name="tel_no"
                                                value={editEmployee.tel_no}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            emp.tel_no
                                        )}
                                    </td>
                                    {/* Display startwork and birthdate in "dd MMM yyyy" format */}
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {formatDateDisplay(emp.startwork)}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {formatDateDisplay(emp.birthdate)}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editEmployee && editEmployee.emp_id === emp.emp_id ? (
                                            <input
                                                type="number"
                                                name="salary"
                                                value={editEmployee.salary}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            emp.salary
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editEmployee && editEmployee.emp_id === emp.emp_id ? (
                                            <input
                                                type="text"
                                                name="branch"
                                                value={editEmployee.branch}
                                                onChange={handleEditChange}
                                            />
                                        ) : (
                                            emp.branch
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        {editEmployee && editEmployee.emp_id === emp.emp_id ? (
                                            <>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="New Password"
                                                    value={editEmployee.password}
                                                    onChange={handleEditChange}
                                                    style={{ marginBottom: '5px' }}
                                                />
                                                <br />
                                                <button
                                                    onClick={() => handleSave(emp.emp_id)}
                                                    style={{ marginRight: '5px' }}
                                                >
                                                    บันทึก
                                                </button>
                                                <button onClick={handleCancelEdit}>ยกเลิก</button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(emp)}
                                                    style={{ marginRight: '5px' }}
                                                >
                                                    แก้ไข
                                                </button>
                                                <button onClick={() => handleDelete(emp.emp_id)}>
                                                    ไล่ออก
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
