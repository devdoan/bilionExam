const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Lấy token từ header 'Authorization' của người gửi
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Tách chữ "Bearer" ra để lấy đúng cái mã

    if (!token) {
        return res.status(401).json({ message: '⛔ Từ chối truy cập. Bạn chưa cung cấp Token!' });
    }

    try {
        // 2. Kiểm tra xem thẻ có phải hàng giả không (giải mã bằng chữ ký bí mật trong file .env)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Nếu thẻ thật, lấy thông tin user (id, role) gắn vào request để API sau sử dụng
        req.user = decoded;
        next(); // Mở cổng cho phép đi tiếp vào API Tạo đề thi
    } catch (error) {
        res.status(403).json({ message: '⛔ Token không hợp lệ hoặc đã hết hạn!' });
    }
};

module.exports = verifyToken;