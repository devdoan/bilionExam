const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    content: { type: String, required: true },
    points: { type: Number, default: 1 },
    passageText: { type: String, default: '' },

    // NÂNG CẤP: Mã nhóm để gom các câu hỏi của cùng 1 bài đọc lại với nhau
    groupId: {
        type: String,
        default: null
    },

    // NÂNG CẤP: Bộ quy tắc trừ điểm lũy tiến (Chỉ cần cài ở câu hỏi cha/câu đầu tiên của nhóm)
    penaltyRules: [{
        wrongCount: { type: Number, required: true }, // Số câu sai
        deductPoints: { type: Number, required: true } // Điểm bị trừ tương ứng
    }],

    type: {
        type: String,
        enum: ['single', 'multiple', 'short'],
        default: 'single'
    },

    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },

    options: [{ id: { type: String, required: true }, text: { type: String, required: true } }],
    mediaType: { type: String, enum: ['image', 'audio', 'none'], default: 'none' },
    mediaUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);