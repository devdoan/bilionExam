const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');

// Nhập bộ đôi bảo vệ từ middleware auth
const { verifyToken, authorize } = require('../middleware/auth');

/**
 * 1. API: Lấy danh sách đề thi (Đã nâng cấp thông minh cho cả học sinh và giáo viên)
 * URL: GET http://localhost:5000/api/exams/
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        let exams;
        if (req.user.role === 'Student') {
            // Học sinh chỉ được thấy những đề mà Giáo viên đã đánh dấu là "Đã đăng"
            exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 });
        } else {
            // Giáo viên/Admin thì thấy toàn bộ đề do mình tạo ra
            exams = await Exam.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
        }
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi lấy danh sách đề!', error: error.message });
    }
});

/**
 * 2. API: Tạo đề thi mới
 * URL: POST http://localhost:5000/api/exams/create
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
 * URL: GET http://localhost:5000/api/exams/:id
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
            type: q.type
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
 * 4. API: Nộp bài và chấm điểm (Đã được nâng cấp logic đồng bộ chuỗi)
 * URL: POST http://localhost:5000/api/exams/:id/submit
 */
router.post('/:id/submit', verifyToken, async (req, res) => {
    try {
        const { answers } = req.body;
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

        questions.forEach(q => {
            totalExamPoints += q.points;
            if (q.groupId) groupMistakes[q.groupId] = 0;
        });

        const resultAnswers = [];

        questions.forEach(question => {
            const studentAnsString = answers[question._id.toString()] || "";

            resultAnswers.push({
                questionId: question._id,
                selectedOption: studentAnsString
            });

            let isCorrect = false;

            if (question.type === 'short') {
                const studentText = studentAnsString.trim().toLowerCase();
                const correctText = (question.correctAnswer || "").toString().trim().toLowerCase();
                isCorrect = (studentText === correctText && studentText !== "");
            } else {
                isCorrect = (studentAnsString === question.correctAnswer);
            }

            if (isCorrect) {
                earnedPoints += question.points;
                correctCount++;
            } else if (question.groupId) {
                groupMistakes[question.groupId]++;
            }
        });

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

        if (earnedPoints < 0) earnedPoints = 0;
        const score = (earnedPoints / totalExamPoints) * 10;
        const roundedScore = Math.round(score * 100) / 100;

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
 * URL: GET http://localhost:5000/api/exams/results/:resultId
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
 * URL: GET http://localhost:5000/api/exams/:id/all-results
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

/**
 * =========================================================================
 * 7. API MỚI THÊM VÀO: XÓA ĐỀ THI (VÀ TOÀN BỘ CÂU HỎI + KẾT QUẢ ĐI KÈM)
 * URL: DELETE http://localhost:5000/api/exams/:id
 * =========================================================================
 */
router.delete('/:id', verifyToken, authorize(['Teacher', 'Super Admin']), async (req, res) => {
    try {
        const examId = req.params.id;

        // 1. Kiểm tra xem đề thi có tồn tại không
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: '⛔ Không tìm thấy đề thi cần xóa!' });
        }

        // 2. Bảo mật: Chỉ người tạo ra đề này hoặc Super Admin mới có quyền xóa
        if (exam.teacherId.toString() !== req.user.id && req.user.role !== 'Super Admin') {
            return res.status(403).json({ message: '⛔ Bạn không có quyền xóa đề thi của người khác!' });
        }

        // 3. Dọn rác Database: Xóa sạch tất cả câu hỏi thuộc về đề này
        await Question.deleteMany({ examId: examId });

        // 4. Dọn rác Database: Xóa sạch tất cả kết quả thi của học sinh ở đề này
        await Result.deleteMany({ examId: examId });

        // 5. Cuối cùng, xóa bỏ chính đề thi đó khỏi hệ thống
        await Exam.findByIdAndDelete(examId);

        res.status(200).json({ message: '✅ Đã xóa đề thi và toàn bộ dữ liệu liên quan thành công!' });
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server khi xóa đề thi!', error: error.message });
    }
});

// Luôn luôn nằm ở dòng cuối cùng của file route
module.exports = router;