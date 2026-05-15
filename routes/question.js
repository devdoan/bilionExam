const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// THAY ĐỔI: Nhập bộ đôi bảo vệ từ auth.js
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * API: Thêm câu hỏi vào đề thi
 * QUYỀN: Chỉ Teacher và Super Admin mới được phép
 * Đường dẫn: http://localhost:5000/api/questions/create
 */
router.post('/create', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        // Lấy đầy đủ các dữ liệu mới từ giao diện gửi lên
        const {
            examId,
            content,
            points,
            passageText,
            groupId,
            type,
            options,
            correctAnswer,
            penaltyRules,
            mediaType,
            mediaUrl
        } = req.body;

        // Tạo câu hỏi mới với đầy đủ tính năng (Penalty, Grouping, Short Answer...)
        const newQuestion = new Question({
            examId,
            content,
            points: points || 1,             // Mặc định 1 điểm nếu không nhập
            passageText: passageText || '',  // Nội dung bài đọc dùng chung
            groupId: groupId || '',          // Mã để gom nhóm câu hỏi
            type: type || 'single',          // 'single', 'multiple', hoặc 'short'
            options,
            correctAnswer,
            penaltyRules: penaltyRules || [], // Danh sách luật trừ điểm lũy tiến
            mediaType: mediaType || 'none',
            mediaUrl: mediaUrl || ''
        });

        // Lưu vào Database
        await newQuestion.save();

        res.status(201).json({
            message: '✅ Thêm câu hỏi và cài đặt luật thành công!',
            question: newQuestion
        });

    } catch (error) {
        res.status(500).json({
            message: '❌ Lỗi server khi thêm câu hỏi!',
            error: error.message
        });
    }
});

module.exports = router;