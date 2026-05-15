// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, adminSecret } = req.body;

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) return res.status(400).json({ message: '⛔ Tài khoản đã tồn tại!' });

        let finalRole = 'Student'; // Mọi người đăng ký mặc định là Học sinh

        // Chỉ khi nhập đúng mã Admin cực khó này mới được làm Super Admin
        // Mã này bạn nên để trong file .env, ở đây mình ví dụ là 'ADMIN_Vip_999'
        if (adminSecret && adminSecret === process.env.ADMIN_SECRET_KEY) {
            finalRole = 'Super Admin';
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: finalRole
        });

        await newUser.save();
        res.status(201).json({ message: `✅ Đăng ký thành công tài khoản ${finalRole}!` });
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

// Giữ nguyên phần router.post('/login', ...) cũ
// 2. API ĐĂNG NHẬP (Đã nâng cấp logic)
router.post('/login', async (req, res) => {
    try {
        // Biến username gửi từ Frontend giờ có thể chứa Tên đăng nhập HOẶC Email
        const { username, password } = req.body;

        // LOGIC MỚI: Tìm trong Database xem có ai khớp Username HOẶC Email không
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        // Nếu không tìm thấy ai
        if (!user) {
            return res.status(400).json({ message: '⛔ Tài khoản hoặc Email không tồn tại!' });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '⛔ Mật khẩu không chính xác!' });
        }

        // Đăng nhập thành công, cấp thẻ
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: '✅ Đăng nhập thành công!',
            token,
            user: { id: user._id, username: user.username, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});
module.exports = router;