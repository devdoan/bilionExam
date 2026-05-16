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
    }, [resultId, navigate]);

    if (!data) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Đang tải kết quả...</div>;

    const { result, exam, questions } = data;

    // 1. TÍNH TOÁN LẠI SỐ CÂU ĐÚNG ĐỂ HIỂN THỊ
    let correctCount = 0;
    questions.forEach(q => {
        const studentAns = result.answers.find(a => a.questionId === q._id);
        const studentStr = (studentAns?.selectedOption || "").toString();
        const correctStr = (q.correctAnswer || "").toString();

        if (q.type === 'short') {
            if (studentStr.trim().toLowerCase() === correctStr.trim().toLowerCase() && studentStr !== "") correctCount++;
        } else {
            if (studentStr === correctStr && studentStr !== "") correctCount++;
        }
    });

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial' }}>
            <h1 style={{ textAlign: 'center', color: '#28A745' }}>📊 KẾT QUẢ BÀI THI</h1>

            {/* THẺ TỔNG QUAN */}
            <div style={{ textAlign: 'center', marginBottom: '40px', padding: '30px', background: '#f8f9fa', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
                <h2 style={{ color: '#333' }}>{exam.title}</h2>
                <h1 style={{ fontSize: '60px', color: '#dc3545', margin: '10px 0' }}>{result.score} <span style={{fontSize:'30px', color:'#666'}}>/ 10</span></h1>

                {/* Đã bổ sung biến số vào câu nói */}
                <p style={{ fontSize: '18px' }}>
                    Bạn đã làm đúng <strong>{correctCount}</strong> câu trên tổng số <strong>{questions.length}</strong> câu.
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ marginTop: '15px', padding: '10px 25px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                >
                    ⬅ Quay lại Dashboard
                </button>
            </div>

            <hr style={{ border: '1px solid #eee', marginBottom: '30px' }} />

            <h3 style={{ color: '#4A90E2' }}>Chi tiết từng câu:</h3>

            {/* DANH SÁCH CÂU HỎI */}
            {questions.map((q, index) => {
                // 2. LOGIC LẤY ĐÁP ÁN ĐỒNG BỘ CHUỖI VỚI BACKEND
                const studentAns = result.answers.find(a => a.questionId === q._id);
                const studentStr = (studentAns?.selectedOption || "").toString();
                const correctStr = (q.correctAnswer || "").toString();

                let isCorrect = false;
                if (q.type === 'short') {
                    isCorrect = studentStr.trim().toLowerCase() === correctStr.trim().toLowerCase() && studentStr !== "";
                } else {
                    isCorrect = studentStr === correctStr && studentStr !== "";
                }

                return (
                    <div key={q._id} style={{ marginBottom: '20px', padding: '20px', border: `2px solid ${isCorrect ? '#28A745' : '#dc3545'}`, borderRadius: '10px', background: isCorrect ? '#f0fdf4' : '#fff5f5' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Câu {index + 1}: <span style={{fontWeight:'normal'}}>{q.content}</span></p>
                            <span style={{ background: '#ffc107', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', marginLeft: '10px' }}>
                                {q.points} điểm
                            </span>
                        </div>

                        {/* Hiển thị lại bài đọc nếu có */}
                        {q.passageText && (
                            <div style={{ background: '#fff', padding: '10px', borderLeft: '4px solid #17a2b8', margin: '15px 0', fontSize: '14px', fontStyle: 'italic' }}>
                                {q.passageText}
                            </div>
                        )}

                        <div style={{ marginTop: '15px' }}>
                            {q.type !== 'short' ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {q.options.map(opt => {
                                        // 3. LOGIC XỬ LÝ NHIỀU ĐÁP ÁN DẠNG CHUỖI (VD: "A,B")
                                        const isCorrectOption = correctStr.includes(opt.id);
                                        const isSelectedOption = studentStr.includes(opt.id);

                                        let optionColor = '#333';
                                        let optionBg = 'transparent';
                                        let icon = '';

                                        if (isCorrectOption) {
                                            optionColor = '#155724';
                                            optionBg = '#d4edda'; // Highlight xanh lá
                                            icon = '✔️ (Đáp án chuẩn)';
                                        } else if (isSelectedOption && !isCorrectOption) {
                                            optionColor = '#721c24';
                                            optionBg = '#f8d7da'; // Highlight đỏ
                                            icon = '❌ (Bạn chọn sai)';
                                        }

                                        return (
                                            <li key={opt.id} style={{
                                                padding: '8px 12px',
                                                marginBottom: '5px',
                                                borderRadius: '5px',
                                                color: optionColor,
                                                backgroundColor: optionBg,
                                                border: isSelectedOption ? '1px solid #999' : '1px solid transparent',
                                                fontWeight: (isCorrectOption || isSelectedOption) ? 'bold' : 'normal'
                                            }}>
                                                {opt.id}. {opt.text} <span style={{marginLeft: '10px', fontSize: '14px'}}>{icon}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                // 4. HIỂN THỊ CÂU TRẢ LỜI NGẮN
                                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                    <p style={{ margin: '0 0 10px 0', color: isCorrect ? '#28A745' : '#dc3545' }}>
                                        <strong>Bài làm của bạn:</strong> {studentStr || <span style={{fontStyle:'italic', color:'gray'}}>(Bạn đã bỏ trống)</span>}
                                    </p>
                                    <p style={{ margin: 0, color: '#28A745' }}>
                                        <strong>Đáp án chuẩn:</strong> {correctStr}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ResultDetailPage;