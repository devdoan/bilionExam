const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');

// THAY ĐỔI: Nhập cả 2 hàm từ chú bảo vệ mới
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * 1. API: Lấy danh sách đề thi của Giáo viên/Admin (Dashboard quản trị)
 * QUYỀN: Teacher, Super Admin
 */
router.get('/', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        const exams = await Exam.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi lấy danh sách đề!', error: error.message });
    }
});

/**
 * 2. API: Tạo đề thi mới
 * QUYỀN: Teacher, Super Admin
 */
router.post('/create', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        const { title, timeLimit, isPublished } = req.body;

        const newExam = new Exam({
            title,
            timeLimit,
            isPublished: isPublished || false,
            teacherId: req.user.id
        });

        await newExam.save();
        res.status(201).json({ message: '✅ Tạo đề thi thành công!', exam: newExam });
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

/**
 * 3. API: Lấy chi tiết đề thi cho Học sinh làm bài
 * QUYỀN: Tất cả (Student, Teacher, Super Admin) đều được xem đề
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: '⛔ Không tìm thấy đề thi!' });

        const questions = await Question.find({ examId: req.params.id });

        const safeQuestions = questions.map(q => ({
            _id: q._id,
            content: q.content,
            mediaType: q.mediaType,
            mediaUrl: q.mediaUrl,
            options: q.options,
            points: q.points,
            passageText: q.passageText,
            groupId: q.groupId,
            type: q.type // Gửi kèm loại câu hỏi để giao diện hiển thị đúng (radio/checkbox/input)
        }));

        res.status(200).json({
            message: '✅ Lấy đề thi thành công!',
            exam: exam,
            questions: safeQuestions
        });
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

/**
 * 4. API: Nộp bài và chấm điểm (Đã được nâng cấp logic đồng bộ)
 */
router.post('/:id/submit', verifyToken, async (req, res) => {
    try {
        const { answers } = req.body; // answers lúc này là Object: { "id_cau_1": "A", "id_cau_2": "A,B" }
        const examId = req.params.id;
        const studentId = req.user.id;

        const questions = await Question.find({ examId: examId });
        if (!questions || questions.length === 0) {
            return res.status(400).json({ message: '⛔ Đề thi này chưa có câu hỏi nào!' });
        }

        let earnedPoints = 0;
        let totalExamPoints = 0;
        let correctCount = 0;
        const totalQuestions = questions.length;
        let groupMistakes = {};

        // Khởi tạo bộ đếm điểm nhóm (Giữ nguyên logic của bạn)
        questions.forEach(q => {
            totalExamPoints += q.points;
            if (q.groupId) groupMistakes[q.groupId] = 0;
        });

        const resultAnswers = []; // Mảng chuẩn bị xuất xưởng vào Database Result.js

        // Vòng lặp chấm điểm TỪNG CÂU HỎI TRONG ĐỀ
        questions.forEach(question => {
            // 1. Lấy đáp án học sinh từ Object (Nếu học sinh bỏ trống, tự đổi thành chuỗi rỗng "")
            const studentAnsString = answers[question._id.toString()] || "";

            // 2. Đóng gói vào mảng chuẩn định dạng của models/Result.js
            resultAnswers.push({
                questionId: question._id,
                selectedOption: studentAnsString
            });

            let isCorrect = false;

            // 3. Logic chấm điểm Cực Nhanh (Vì mọi thứ đã được ép thành Chuỗi)
            if (question.type === 'short') {
                // Câu trả lời ngắn: So sánh chuỗi (không phân biệt hoa thường, cắt khoảng trắng 2 đầu)
                const studentText = studentAnsString.trim().toLowerCase();
                const correctText = (question.correctAnswer || "").toString().trim().toLowerCase();
                isCorrect = (studentText === correctText && studentText !== "");
            } else {
                // Trắc nghiệm (1 đáp án hoặc nhiều đáp án): Chỉ cần so sánh chuỗi bằng nhau!
                isCorrect = (studentAnsString === question.correctAnswer);
            }

            // 4. Cộng điểm hoặc tính lỗi
            if (isCorrect) {
                earnedPoints += question.points;
                correctCount++;
            } else if (question.groupId) {
                groupMistakes[question.groupId]++;
            }
        });

        // 5. Logic trừ điểm lũy tiến (Giữ nguyên code xuất sắc của bạn)
        for (const groupId in groupMistakes) {
            const mistakes = groupMistakes[groupId];
            if (mistakes > 0) {
                const parentQuestion = questions.find(q => q.groupId === groupId && q.penaltyRules && q.penaltyRules.length > 0);
                if (parentQuestion) {
                    const rules = parentQuestion.penaltyRules.sort((a, b) => b.wrongCount - a.wrongCount);
                    const appliedRule = rules.find(rule => mistakes >= rule.wrongCount);
                    if (appliedRule) earnedPoints -= appliedRule.deductPoints;
                }
            }
        }

        // Tính toán điểm số cuối cùng (thang điểm 10)
        if (earnedPoints < 0) earnedPoints = 0;
        const score = (earnedPoints / totalExamPoints) * 10;
        const roundedScore = Math.round(score * 100) / 100;

        // Lưu vào Database với mảng answers đã chuẩn hóa
        const newResult = new Result({
            studentId,
            examId,
            score: roundedScore,
            answers: resultAnswers
        });

        await newResult.save();

        res.status(201).json({
            message: '✅ Nộp bài thành công!',
            score: roundedScore,
            correctAnswers: correctCount,
            totalQuestions: totalQuestions,
            resultId: newResult._id
        });
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

/**
 * 5. API: Lấy kết quả cá nhân
 */
router.get('/results/:resultId', verifyToken, async (req, res) => {
    try {
        const result = await Result.findById(req.params.resultId);
        if (!result) return res.status(404).json({ message: '⛔ Không tìm thấy kết quả!' });

        const exam = await Exam.findById(result.examId);
        const questions = await Question.find({ examId: result.examId });

        res.status(200).json({ result, exam, questions });
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

/**
 * 6. API: Xuất bảng điểm cho Giáo viên
 * QUYỀN: Teacher, Super Admin
 */
router.get('/:id/all-results', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        const results = await Result.find({ examId: req.params.id })
            .populate('studentId', 'username email')
            .sort({ createdAt: -1 });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi lấy bảng điểm!', error: error.message });
    }
});

module.exports = router;