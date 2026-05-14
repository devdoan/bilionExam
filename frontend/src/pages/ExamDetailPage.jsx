import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const ExamDetailPage = () => {
    const { examId } = useParams();
    const [examData, setExamData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await axiosClient.get(`/exams/${examId}`);
                setExamData(response.data);
            } catch (error) {
                alert('❌ Không thể tải chi tiết đề thi');
            }
        };
        fetchDetail();
    }, [examId]);

    if (!examData) return <p>Đang tải dữ liệu...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={() => navigate('/dashboard')}>⬅ Quay lại Dashboard</button>
            <h1>📝 Chi tiết: {examData.exam.title}</h1>
            <p>⏱ Thời gian: {examData.exam.timeLimit} phút</p>
            <hr />
            <h3>Danh sách câu hỏi ({examData.questions.length}):</h3>
            {examData.questions.map((q, index) => (
                <div key={q._id} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
                    <p><strong>Câu {index + 1}:</strong> {q.content}</p>
                    <ul>
                        {q.options.map(opt => (
                            <li key={opt._id}>{opt.id}: {opt.text}</li>
                        ))}
                    </ul>
                    {/* Vì đây là trang của giáo viên, ta có thể hiển thị thêm điểm số */}
                    <p><i>Điểm: {q.points}</i></p>
                </div>
            ))}
        </div>
    );
};

export default ExamDetailPage;