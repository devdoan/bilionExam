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

/**
 * API: Cập nhật câu hỏi
 * QUYỀN: Chỉ Teacher và Super Admin mới được phép
 * Đường dẫn: http://localhost:5000/api/questions/:id
 */
router.put('/:id', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        const questionId = req.params.id;
        const {
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

        // Tìm câu hỏi cần cập nhật
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: '⛔ Không tìm thấy câu hỏi!' });
        }

        // Cập nhật các trường
        question.content = content;
        question.points = points || 1;
        question.passageText = passageText || '';
        question.groupId = groupId || '';
        question.type = type || 'single';
        question.options = options;
        question.correctAnswer = correctAnswer;
        question.penaltyRules = penaltyRules || [];
        question.mediaType = mediaType || 'none';
        question.mediaUrl = mediaUrl || '';

        await question.save();

        res.status(200).json({
            message: '✅ Cập nhật câu hỏi thành công!',
            question
        });

    } catch (error) {
        res.status(500).json({
            message: '❌ Lỗi server khi cập nhật câu hỏi!',
            error: error.message
        });
    }
});

/**
 * API: Xóa câu hỏi
 * QUYỀN: Chỉ Teacher và Super Admin mới được phép
 * Đường dẫn: http://localhost:5000/api/questions/:id
 */
router.delete('/:id', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        const questionId = req.params.id;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: '⛔ Không tìm thấy câu hỏi!' });
        }

        await Question.findByIdAndDelete(questionId);

        res.status(200).json({
            message: '✅ Xóa câu hỏi thành công!'
        });

    } catch (error) {
        res.status(500).json({
            message: '❌ Lỗi server khi xóa câu hỏi!',
            error: error.message
        });
    }
});

/**
 * API: Lấy thông tin một câu hỏi
 * QUYỀN: Chỉ Teacher và Super Admin mới được phép
 * Đường dẫn: http://localhost:5000/api/questions/:id
 */
router.get('/:id', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        const questionId = req.params.id;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: '⛔ Không tìm thấy câu hỏi!' });
        }

        res.status(200).json({
            message: '✅ Lấy thông tin câu hỏi thành công!',
            question
        });

    } catch (error) {
        res.status(500).json({
            message: '❌ Lỗi server khi lấy câu hỏi!',
            error: error.message
        });
    }
});

module.exports = router;