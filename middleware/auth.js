const jwt = require('jsonwebtoken');

/**
 * 1. Middleware kiểm tra Token (Xác thực người dùng đã đăng nhập hay chưa)
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '⛔ Từ chối truy cập. Bạn chưa cung cấp Token!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Lưu thông tin user (bao gồm id và role) vào req.user để các bước sau sử dụng
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: '⛔ Token không hợp lệ hoặc đã hết hạn!' });
    }
};

/**
 * 2. Middleware kiểm tra Quyền hạn (Phân chia giai cấp)
 * @param {Array} allowedRoles - Danh sách các chức vụ được phép truy cập (VD: ['Teacher', 'Super Admin'])
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // Kiểm tra xem user có tồn tại và role của họ có nằm trong danh sách cho phép không
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `⛔ Truy cập bị chặn! Bạn là ${req.user.role || 'khách'}, không có quyền thực hiện hành động này.`
            });
        }
        next(); // Quyền hạn hợp lệ, cho phép đi tiếp
    };
};

// Xuất cả hai hàm ra để sử dụng
module.exports = { verifyToken, authorize };