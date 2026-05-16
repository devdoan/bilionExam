// frontend/src/pages/AdminUserPage.jsx
import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AdminUserPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tách hàm fetchUsers ra để có thể tái sử dụng
    const fetchUsers = async () => {
        try {
            const res = await axiosClient.get('/users/all');
            setUsers(res.data);
        } catch (error) {
            alert('❌ Lỗi tải danh sách người dùng: ' + (error.response?.data?.message || 'Vui lòng thử lại'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const promoteToTeacher = async (userId) => {
        if (window.confirm("Cấp quyền Giáo viên cho người này?")) {
            try {
                await axiosClient.put('/users/update-role', { userId, newRole: 'Teacher' });
                alert("✅ Nâng cấp Giáo viên thành công!");

                // MƯỢT MÀ: Chỉ cần gọi lại fetchUsers để React tự vẽ lại bảng mà không cần F5 reload trang
                fetchUsers();
            } catch (error) {
                alert('❌ Lỗi cấp quyền: ' + (error.response?.data?.message || ''));
            }
        }
    };

    if (loading) return <p style={{ padding: '20px' }}>⏳ Đang tải danh sách...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ color: '#D32F2F' }}>🛡️ Bảng Điều Khiển Super Admin</h1>
            <p>Xin chào! Tại đây bạn có thể quản lý và cấp quyền cho người dùng.</p>

            <table border="1" cellPadding="12" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f4f4f4' }}>
                <tr>
                    <th>Username</th>
                    <th>Chức vụ hiện tại</th>
                    <th>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u._id}>
                        <td><strong>{u.username}</strong></td>
                        <td>
                            <span style={{
                                padding: '5px 10px',
                                borderRadius: '5px',
                                backgroundColor: u.role === 'Super Admin' ? '#ffc107' : u.role === 'Teacher' ? '#17a2b8' : '#e9ecef',
                                fontWeight: 'bold'
                            }}>
                                {u.role}
                            </span>
                        </td>
                        <td>
                            {u.role === 'Student' && (
                                <button
                                    onClick={() => promoteToTeacher(u._id)}
                                    style={{background: '#28A745', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                                >
                                    Nâng lên Giáo viên 🎓
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserPage;