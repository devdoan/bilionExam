const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const verifyToken = require('../middleware/auth'); // Tiếp tục gọi người bảo vệ

// API: Thêm câu hỏi vào đề thi (Phương thức POST)
// Đường dẫn: http://localhost:5000/api/questions/create
router.post('/create', verifyToken, async (req, res) => {
    try {
        // Chỉ Admin hoặc Teacher mới được quyền thêm câu hỏi
        if (req.user.role !== 'Super Admin' && req.user.role !== 'Teacher') {
            return res.status(403).json({ message: '⛔ Bạn không có quyền thêm câu hỏi!' });
        }

        const { examId, content, mediaType, mediaUrl, options, correctAnswer } = req.body;

        // Tạo câu hỏi mới dựa trên dữ liệu gửi lên
        const newQuestion = new Question({
            examId,
            content,
            mediaType: mediaType || 'none',
            mediaUrl: mediaUrl || '',
            options,
            correctAnswer
        });

        // Lưu câu hỏi vào MongoDB
        await newQuestion.save();
        res.status(201).json({ message: '✅ Thêm câu hỏi thành công!', question: newQuestion });

    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

module.exports = router;