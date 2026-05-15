// frontend/src/pages/AdminUserPage.jsx
import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AdminUserPage = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await axiosClient.get('/users/all');
            setUsers(res.data);
        };
        fetchUsers();
    }, []);

    const promoteToTeacher = async (userId) => {
        if (window.confirm("Cấp quyền Giáo viên cho người này?")) {
            await axiosClient.put('/users/update-role', { userId, newRole: 'Teacher' });
            alert("Thành công!");
            window.location.reload();
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>🛡️ Quản lý người dùng (Dành cho Mẹ)</h1>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr>
                    <th>Username</th>
                    <th>Chức vụ hiện tại</th>
                    <th>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u._id}>
                        <td>{u.username}</td>
                        <td>{u.role}</td>
                        <td>
                            {u.role === 'Student' && (
                                <button onClick={() => promoteToTeacher(u._id)} style={{background: 'green', color: 'white'}}>
                                    Nâng lên Giáo viên
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