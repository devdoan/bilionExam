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
 * 4. API: Nộp bài và chấm điểm
 * QUYỀN: Thường là Student (nhưng cho phép Teacher/Admin làm thử cũng không sao)
 */
router.post('/:id/submit', verifyToken, async (req, res) => {
    // ... Giữ nguyên logic chấm điểm cực hay của bạn ở đây ...
    // (Phần này bạn đã tối ưu Penalty và so sánh đa dạng loại câu hỏi rồi nên mình không sửa logic bên trong)
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

        answers.forEach(studentAnswer => {
            const question = questions.find(q => q._id.toString() === studentAnswer.questionId);
            if (!question) return;

            let isCorrect = false;
            if (question.type === 'single') {
                isCorrect = question.correctAnswer === studentAnswer.selectedOption;
            } else if (question.type === 'multiple') {
                const studentChoices = studentAnswer.selectedOptions || [];
                isCorrect = question.correctAnswer.length === studentChoices.length &&
                    question.correctAnswer.every(val => studentChoices.includes(val));
            } else if (question.type === 'short') {
                const studentText = (studentAnswer.answerText || "").trim().toLowerCase();
                const correctText = question.correctAnswer.trim().toLowerCase();
                isCorrect = studentText === correctText;
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
            answers
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