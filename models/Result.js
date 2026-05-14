const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    // Liên kết với Học sinh làm bài
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Liên kết với Đề thi
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },

    // Điểm số đạt được
    score: {
        type: Number,
        required: true
    },

    // Chi tiết bài làm: Lưu lại mảng việc học sinh chọn đáp án A, B, C hay D ở từng câu
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: String, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);