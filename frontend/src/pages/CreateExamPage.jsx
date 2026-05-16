import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const CreateExamPage = () => {
    const [title, setTitle] = useState('');
    const [timeLimit, setTimeLimit] = useState(45);
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Lấy response trả về từ Backend
            const res = await axiosClient.post('/exams/create', { title, timeLimit });
            alert('✅ Tạo đề thi thành công! Hãy bắt đầu thêm câu hỏi nhé.');

            // UX NÂNG CẤP: Chuyển thẳng sang trang Thêm Câu Hỏi của đề thi vừa tạo
            const newExamId = res.data.exam._id;
            navigate(`/add-question/${newExamId}`);

        } catch (error) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể tạo đề'));
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ color: '#4A90E2' }}>📝 TẠO ĐỀ THI MỚI</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label><strong>Tên đề thi:</strong></label><br />
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Kiểm tra 15 phút - Unit 1"
                        required
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                    />
                </div>
                <div>
                    <label><strong>Thời gian làm bài (phút):</strong></label><br />
                    <input
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <button type="submit" style={{ padding: '10px 20px', background: '#28A745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Lưu & Tiếp tục
                    </button>
                    <button type="button" onClick={() => navigate('/dashboard')} style={{ marginLeft: '10px', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateExamPage;