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
            await axiosClient.post('/exams/create', { title, timeLimit });
            alert('✅ Tạo đề thi thành công!');
            navigate('/dashboard');
        } catch (error) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể tạo đề'));
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>📝 TẠO ĐỀ THI MỚI</h2>
            <form onSubmit={handleCreate}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Tên đề thi:</label><br />
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                           placeholder="Ví dụ: Kiểm tra 15 phút - Unit 1" required style={{ width: '300px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Thời gian làm bài (phút):</label><br />
                    <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} required />
                </div>
                <button type="submit" style={{ padding: '10px 20px', background: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Lưu đề thi
                </button>
                <button type="button" onClick={() => navigate('/dashboard')} style={{ marginLeft: '10px' }}>Hủy</button>
            </form>
        </div>
    );
};

export default CreateExamPage;