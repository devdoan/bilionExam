// backend/routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, authorize } = require('../middleware/auth');

// 1. Lấy danh sách tất cả người dùng (Chỉ Admin mới xem được)
router.get('/all', verifyToken, authorize(['Super Admin']), async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Không lấy mật khẩu
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách' });
    }
});

// 2. Thay đổi chức vụ (Chỉ Admin mới được bấm nút này)
router.put('/update-role', verifyToken, authorize(['Super Admin']), async (req, res) => {
    try {
        const { userId, newRole } = req.body;
        await User.findByIdAndUpdate(userId, { role: newRole });
        res.json({ message: '✅ Đã cập nhật quyền hạn thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
});

module.exports = router;