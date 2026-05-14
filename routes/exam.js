const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const verifyToken = require('../middleware/auth'); // Mời chú bảo vệ ra đứng gác

// API: Lấy danh sách tất cả đề thi của giáo viên đang đăng nhập
// Đường dẫn: http://localhost:5000/api/exams
router.get('/', verifyToken, async (req, res) => {
    try {
        // Chỉ lấy những đề thi do chính giáo viên này tạo ra
        const exams = await Exam.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi lấy danh sách đề!', error: error.message });
    }
});

// API: Tạo đề thi mới (Phương thức POST)
// Đường dẫn: http://localhost:5000/api/exams/create
router.post('/create', verifyToken, async (req, res) => {
    try {
        // Chỉ cho phép Admin hoặc Teacher được tạo đề
        if (req.user.role !== 'Super Admin' && req.user.role !== 'Teacher') {
            return res.status(403).json({ message: '⛔ Học sinh không có quyền tạo đề thi!' });
        }

        const { title, timeLimit, isPublished } = req.body;

        // Tạo đề thi mới, lấy luôn ID của người tạo từ cái thẻ VIP (Token)
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

// API: Lấy chi tiết đề thi và danh sách câu hỏi (Phương thức GET)
// Đường dẫn: http://localhost:5000/api/exams/:id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        // 1. Lấy thông tin chung của đề thi
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: '⛔ Không tìm thấy đề thi!' });
        }

        // 2. Tìm tất cả câu hỏi thuộc về đề thi này
        const questions = await Question.find({ examId: req.params.id });

        // 3. Bảo mật: Lọc bỏ trường correctAnswer trước khi gửi về cho Học sinh
        const safeQuestions = questions.map(q => ({
            _id: q._id,
            content: q.content,
            mediaType: q.mediaType,
            mediaUrl: q.mediaUrl,
            options: q.options,
            points: q.points,           // Nâng cấp: Gửi kèm điểm từng câu để học sinh biết
            passageText: q.passageText, // Nâng cấp: Gửi kèm bài đọc
            groupId: q.groupId          // Nâng cấp: Gửi kèm mã nhóm
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

// API: Nộp bài và Tự động tính điểm (Phương thức POST)
// Đường dẫn: http://localhost:5000/api/exams/:id/submit
router.post('/:id/submit', verifyToken, async (req, res) => {
    try {
        // 1. Lấy bài làm học sinh gửi lên và các ID cần thiết
        const { answers } = req.body;
        const examId = req.params.id;
        const studentId = req.user.id; // Lấy từ Thẻ từ (Token)

        // 2. Lấy bộ câu hỏi gốc (có chứa đáp án đúng) từ Database
        const questions = await Question.find({ examId: examId });
        if (!questions || questions.length === 0) {
            return res.status(400).json({ message: '⛔ Đề thi này chưa có câu hỏi nào!' });
        }

        // 3. Khởi tạo máy chấm điểm phiên bản "Trừ điểm lũy tiến"
        let earnedPoints = 0;
        let totalExamPoints = 0;

        // VÁ LỖI Ở ĐÂY: Khai báo 2 biến đếm số câu
        let correctCount = 0;
        const totalQuestions = questions.length;

        // Tạo một "cuốn sổ" để theo dõi số câu sai của từng nhóm bài đọc
        let groupMistakes = {};

        // Tính tổng điểm và khởi tạo sổ theo dõi
        questions.forEach(q => {
            totalExamPoints += q.points;
            if (q.groupId) {
                groupMistakes[q.groupId] = 0; // Mặc định nhóm này đang sai 0 câu
            }
        });

        // Duyệt qua bài làm của học sinh
        answers.forEach(studentAnswer => {
            const question = questions.find(q => q._id.toString() === studentAnswer.questionId);
            if (!question) return;

            let isCorrect = false;

            if (question.type === 'single') {
                // So sánh 1 đáp án duy nhất
                isCorrect = question.correctAnswer === studentAnswer.selectedOption;
            } else if (question.type === 'multiple') {
                // So sánh mảng (Học sinh phải chọn đúng và đủ tất cả các đáp án đúng)
                const studentChoices = studentAnswer.selectedOptions || []; // Giao diện gửi lên mảng
                isCorrect = question.correctAnswer.length === studentChoices.length &&
                    question.correctAnswer.every(val => studentChoices.includes(val));
            } else if (question.type === 'short') {
                // So sánh văn bản (Không phân biệt hoa thường, cắt bỏ khoảng trắng thừa)
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

        // 4. BẮT ĐẦU PHẠT TRỪ ĐIỂM THEO NHÓM
        // Duyệt qua từng nhóm bài đọc xem học sinh sai bao nhiêu câu
        for (const groupId in groupMistakes) {
            const mistakes = groupMistakes[groupId];

            if (mistakes > 0) {
                // Tìm câu hỏi đại diện chứa quy tắc phạt của nhóm này
                const parentQuestion = questions.find(q => q.groupId === groupId && q.penaltyRules && q.penaltyRules.length > 0);

                if (parentQuestion) {
                    // Tra cứu luật: Học sinh sai 'mistakes' câu thì tương ứng trừ bao nhiêu?
                    // Sắp xếp giảm dần để ưu tiên mức phạt nặng nhất nếu thỏa mãn
                    const rules = parentQuestion.penaltyRules.sort((a, b) => b.wrongCount - a.wrongCount);

                    const appliedRule = rules.find(rule => mistakes >= rule.wrongCount);

                    if (appliedRule) {
                        earnedPoints -= appliedRule.deductPoints; // Thực hiện trừ điểm!
                    }
                }
            }
        }

        // Đảm bảo điểm không bị âm
        if (earnedPoints < 0) earnedPoints = 0;

        // 5. Tính quy đổi ra thang điểm 10
        const score = (earnedPoints / totalExamPoints) * 10;
        const roundedScore = Math.round(score * 100) / 100;

        // 6. Lưu điểm số và chi tiết bài làm vào bảng Result
        const newResult = new Result({
            studentId,
            examId,
            score: roundedScore,
            answers // Mảng lưu lại việc học sinh chọn A hay B ở từng câu để báo cáo
        });

        await newResult.save();

        // 7. Gửi bảng điểm ngay lập tức về cho học sinh
        res.status(201).json({
            message: '✅ Nộp bài thành công!',
            score: roundedScore,
            correctAnswers: correctCount, // Đã có biến để truyền vào
            totalQuestions: totalQuestions, // Đã có biến để truyền vào
            resultId: newResult._id
        });

    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

// API: Lấy chi tiết kết quả bài làm để xem lại
// Đường dẫn: http://localhost:5000/api/exams/results/:resultId
router.get('/results/:resultId', verifyToken, async (req, res) => {
    try {
        // 1. Tìm kết quả bài làm
        const result = await Result.findById(req.params.resultId);
        if (!result) return res.status(404).json({ message: '⛔ Không tìm thấy kết quả!' });

        // 2. Lấy thông tin đề thi và TẤT CẢ câu hỏi (bao gồm cả correctAnswer)
        const exam = await Exam.findById(result.examId);
        const questions = await Question.find({ examId: result.examId });

        res.status(200).json({ result, exam, questions });
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi server!', error: error.message });
    }
});

// API: Lấy danh sách kết quả của tất cả học sinh trong một đề thi (Dành cho giáo viên)
// Đường dẫn: http://localhost:5000/api/exams/:id/all-results
router.get('/:id/all-results', verifyToken, async (req, res) => {
    try {
        // Tìm tất cả kết quả của đề thi này và "bốc" thêm tên học sinh từ bảng User
        const results = await Result.find({ examId: req.params.id })
            .populate('studentId', 'username email')
            .sort({ createdAt: -1 });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: '❌ Lỗi lấy bảng điểm!', error: error.message });
    }
});

module.exports = router;