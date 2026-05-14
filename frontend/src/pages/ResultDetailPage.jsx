import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const ResultDetailPage = () => {
    const { resultId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await axiosClient.get(`/exams/results/${resultId}`);
                setData(res.data);
            } catch (err) {
                alert("❌ Không thể tải kết quả!");
                navigate('/dashboard');
            }
        };
        fetchResult();
    }, [resultId]);

    if (!data) return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải kết quả...</div>;

    const { result, exam, questions } = data;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center', color: '#28A745' }}>📊 KẾT QUẢ BÀI THI</h1>
            <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                <h2>{exam.title}</h2>
                <h1 style={{ fontSize: '48px', color: '#dc3545' }}>{result.score} / 10</h1>
                <p>Bạn đã làm đúng câu trả lời trên tổng số câu.</p>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Quay lại Dashboard</button>
            </div>

            <hr />
            <h3>Chi tiết từng câu:</h3>
            {questions.map((q, index) => {
                const studentAns = result.answers.find(a => a.questionId === q._id);
                const isCorrect = (q.type === 'single' && studentAns?.selectedOption === q.correctAnswer) ||
                    (q.type === 'short' && studentAns?.answerText?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());

                return (
                    <div key={q._id} style={{ marginBottom: '20px', padding: '15px', border: `2px solid ${isCorrect ? '#28A745' : '#dc3545'}`, borderRadius: '10px' }}>
                        <p><strong>Câu {index + 1}:</strong> {q.content} ({q.points} điểm)</p>

                        {q.type !== 'short' ? (
                            <ul>
                                {q.options.map(opt => (
                                    <li key={opt.id} style={{
                                        color: opt.id === q.correctAnswer ? 'green' : (opt.id === studentAns?.selectedOption ? 'red' : 'black'),
                                        fontWeight: (opt.id === q.correctAnswer || opt.id === studentAns?.selectedOption) ? 'bold' : 'normal'
                                    }}>
                                        {opt.id}. {opt.text}
                                        {opt.id === q.correctAnswer && " ✔️ (Đáp án đúng)"}
                                        {opt.id === studentAns?.selectedOption && opt.id !== q.correctAnswer && " ❌ (Bạn chọn)"}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>
                                <p style={{ color: isCorrect ? 'green' : 'red' }}>
                                    <strong>Bài làm của bạn:</strong> {studentAns?.answerText || "(Bỏ trống)"}
                                </p>
                                <p style={{ color: 'green' }}><strong>Đáp án đúng:</strong> {q.correctAnswer}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ResultDetailPage;