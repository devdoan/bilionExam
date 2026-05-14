const mongoose = require('mongoose');

// Khởi tạo bộ khung (Schema) cho Người dùng
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, // Bắt buộc phải nhập
        unique: true    // Không được trùng lặp với người khác
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Super Admin', 'Teacher', 'Student'], // Chỉ cho phép 1 trong 3 chức vụ này
        default: 'Student' // Nếu không truyền vào, hệ thống tự hiểu là Học sinh
    }
}, {
    timestamps: true // Tự động tạo thêm 2 cột: thời gian tạo (createdAt) và thời gian cập nhật (updatedAt)
});

// Đóng gói và xuất ra để các file khác (ví dụ file xử lý đăng nhập) có thể sử dụng
module.exports = mongoose.model('User', userSchema);