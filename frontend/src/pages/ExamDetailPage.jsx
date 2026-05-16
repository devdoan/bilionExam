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

    if (!examData) return <p style={{ padding: '20px', textAlign: 'center' }}>⏳ Đang tải dữ liệu...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
            <button
                onClick={() => navigate('/dashboard')}
                style={{ padding: '8px 15px', marginBottom: '20px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc', background: '#f8f9fa' }}
            >
                ⬅ Quay lại Dashboard
            </button>

            {/* Thông tin tổng quan đề thi */}
            <div style={{ background: '#e9ecef', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #4A90E2' }}>
                <h1 style={{ color: '#4A90E2', marginTop: 0 }}>📝 Đề thi: {examData.exam.title}</h1>
                <p style={{ fontSize: '16px' }}><strong>⏱ Thời gian làm bài:</strong> {examData.exam.timeLimit} phút</p>
                <p style={{ fontSize: '16px' }}><strong>Trạng thái:</strong> {examData.exam.isPublished ? '✅ Đã phát hành cho Học sinh' : '🛠️ Đang soạn thảo'}</p>
            </div>

            {/* Header danh sách câu hỏi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Danh sách câu hỏi ({examData.questions.length}):</h3>
                <button
                    onClick={() => navigate(`/add-question/${examId}`)}
                    style={{ padding: '10px 15px', background: '#28A745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ➕ Thêm câu hỏi mới
                </button>
            </div>

            {/* Danh sách thẻ câu hỏi */}
            {examData.questions.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'gray', textAlign: 'center' }}>Đề thi này hiện chưa có câu hỏi nào.</p>
            ) : (
                examData.questions.map((q, index) => (
                    <div key={q._id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

                        {/* Nội dung câu hỏi và Điểm */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ margin: 0, fontSize: '16px', flex: 1 }}><strong>Câu {index + 1}:</strong> {q.content}</p>
                            <span style={{ background: '#ffc107', color: '#000', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', marginLeft: '15px' }}>
                                ⭐ {q.points} Điểm
                            </span>
                        </div>

                        {/* Hiển thị bài đọc chung (nếu có) */}
                        {q.passageText && (
                            <div style={{ background: '#f8f9fa', padding: '10px', borderLeft: '4px solid #17a2b8', margin: '15px 0', fontSize: '14px' }}>
                                <em>📖 <strong>Bài đọc:</strong> {q.passageText}</em>
                            </div>
                        )}

                        {/* Logic hiển thị đáp án dựa theo loại câu hỏi */}
                        <div style={{ marginTop: '15px', paddingLeft: '10px' }}>
                            {q.type === 'short' ? (
                                <p style={{ color: '#28a745', fontStyle: 'italic', margin: 0 }}>✍️ Học sinh tự nhập câu trả lời ngắn.</p>
                            ) : (
                                <ul style={{ listStyleType: q.type === 'multiple' ? 'square' : 'circle', paddingLeft: '20px', margin: 0 }}>
                                    {q.options.map(opt => (
                                        <li key={opt.id} style={{ marginBottom: '6px' }}>
                                            <strong>{opt.id}:</strong> {opt.text}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Hiển thị Nhóm câu hỏi để Giáo viên dễ quản lý */}
                        {q.groupId && (
                            <p style={{ fontSize: '12px', color: 'gray', marginTop: '15px', marginBottom: 0 }}>
                                🏷️ Thuộc nhóm câu hỏi: <strong>{q.groupId}</strong>
                            </p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default ExamDetailPage;