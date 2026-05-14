const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    // Tên đề thi
    title: {
        type: String,
        required: true
    },

    // ID của giáo viên tạo đề (Liên kết với bảng User)
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Thời gian làm bài (tính bằng phút, ví dụ: 45)
    timeLimit: {
        type: Number,
        required: true
    },

    // Trạng thái: Giáo viên đã muốn hiển thị đề này cho học sinh chưa?
    isPublished: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);