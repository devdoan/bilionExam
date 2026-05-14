const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Gọi bộ khung Người dùng mà chúng ta đã tạo

// API: Tạo tài khoản mới (Phương thức POST)
// Đường dẫn thực tế sẽ là: http://localhost:5000/api/auth/register
router.post('/register', async (req, res) => {
    try {
        // Lấy dữ liệu người dùng gửi lên
        const { username, email, password, role } = req.body;

        // 1. Kiểm tra xem email này đã đăng ký chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        // 2. Mã hóa mật khẩu (Băm mật khẩu ra một chuỗi ký tự loằng ngoằng)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Tạo tài khoản mới dựa trên bộ khung User.js
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'Super Admin' // Mặc định là Super Admin cho tài khoản đầu tiên
        });

        // 4. Lưu thẳng vào MongoDB Atlas
        await newUser.save();
        res.status(201).json({ message: '✅ Tạo tài khoản Super Admin thành công!', user: newUser });

    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

// API: Đăng nhập (Phương thức POST)
// Đường dẫn: http://localhost:5000/api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Kiểm tra email có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email không tồn tại!' });
        }

        // 2. Kiểm tra mật khẩu có khớp không
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng!' });
        }

        // 3. Tạo "chìa khóa" (Token)
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Những thông tin ghim vào thẻ từ
            process.env.JWT_SECRET,            // Chữ ký bí mật lấy từ file .env
            { expiresIn: '1d' }                // Thẻ này có hạn 1 ngày
        );

        // 4. Trả kết quả về cho người dùng
        res.status(200).json({
            message: '✅ Đăng nhập thành công!',
            token: token,
            user: {
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

module.exports = router;