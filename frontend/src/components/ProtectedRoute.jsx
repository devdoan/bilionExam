import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Hợp phần bảo vệ đường dẫn (ProtectedRoute)
 * @param children: Trang mà người dùng muốn vào
 * @param allowedRoles: Danh sách các chức vụ được phép vào trang này
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    // 1. Lấy thông tin người dùng từ localStorage (đã lưu khi đăng nhập)
    const user = JSON.parse(localStorage.getItem('user'));

    // 2. Kiểm tra xem đã đăng nhập chưa
    if (!user) {
        alert("🔒 Bạn cần đăng nhập để truy cập trang này!");
        return <Navigate to="/login" replace />;
    }

    // 3. Kiểm tra xem chức vụ (role) có quyền vào trang này không
    // Lưu ý: Chúng ta dùng đúng tên role bạn đã định nghĩa: 'Super Admin', 'Teacher', 'Student'
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        alert(`⛔ Truy cập bị từ chối! Chức vụ ${user.role} không được phép vào đây.`);

        // Nếu là học sinh mà đi lạc vào trang giáo viên, đẩy về Dashboard chính
        return <Navigate to="/dashboard" replace />;
    }

    // 4. Nếu mọi thứ hợp lệ, cho phép hiển thị trang đó
    return children;
};

export default ProtectedRoute;