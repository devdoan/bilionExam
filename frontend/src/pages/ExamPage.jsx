import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const ExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    // Thêm state để đếm số lần gian lận (chuyển tab)
    const [cheatWarnings, setCheatWarnings] = useState(0);

    // 1. Tải thông tin đề thi
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await axiosClient.get(`/exams/${examId}`);
                setExam(res.data);
                setTimeLeft(res.data.timeLimit * 60);
            } catch (error) {
                console.error("Lỗi tải đề thi");
            }
        };
        fetchExam();
    }, [examId]);

    // 2. Logic đếm ngược thời gian
    useEffect(() => {
        if (timeLeft > 0 && !isSubmitted) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && exam && !isSubmitted) {
            handleSubmit(true); // Hết giờ tự động nộp bài
        }
    }, [timeLeft, isSubmitted, exam]);

    // 3. LOGIC CHỐNG GIAN LẬN: Cảm biến theo dõi trạng thái Tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitted) {
                setCheatWarnings(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 3) {
                        alert("🚨 BẠN ĐÃ RỜI TRANG QUÁ 3 LẦN! Hệ thống tự động thu bài do gian lận.");
                        handleSubmit(true); // Tự động nộp bài (Bỏ qua hỏi xác nhận)
                    } else {
                        alert(`⚠️ CẢNH BÁO GIAN LẬN (${newCount}/3): Yêu cầu bạn không rời khỏi trang thi!`);
                    }
                    return newCount;
                });
            }
        };

        // Gắn tai nghe để theo dõi hành động chuyển tab
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Tháo tai nghe khi component bị hủy hoặc bài đã nộp
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isSubmitted, answers]); // Cần answers ở đây để hàm handleSubmit lấy được đáp án mới nhất khi thu bài

    // 4. Ghi nhận đáp án học sinh
    const handleAnswerChange = (questionId, value, type) => {
        if (type === 'multiple') {
            let currentSelection = answers[questionId] || [];
            if (currentSelection.includes(value)) {
                currentSelection = currentSelection.filter(item => item !== value);
            } else {
                currentSelection = [...currentSelection, value];
            }
            setAnswers({ ...answers, [questionId]: currentSelection });
        } else {
            setAnswers({ ...answers, [questionId]: value });
        }
    };

    // 5. Nộp bài (có tham số isAutoSubmit để biết là tự nộp do gian lận/hết giờ hay học sinh tự bấm)
    const handleSubmit = async (isAutoSubmit = false) => {
        // Nếu học sinh tự bấm nút thì mới hỏi xác nhận
        if (!isAutoSubmit && !isSubmitted && !window.confirm('Bạn có chắc chắn muốn nộp bài?')) return;

        try {
            const formattedAnswers = {};
            for (const [qId, ans] of Object.entries(answers)) {
                if (Array.isArray(ans)) {
                    formattedAnswers[qId] = ans.join(',');
                } else {
                    formattedAnswers[qId] = ans;
                }
            }

            const res = await axiosClient.post(`/exams/${examId}/submit`, {
                answers: formattedAnswers
            });

            setScore(res.data.score);
            setIsSubmitted(true);

            if (!isAutoSubmit) alert('✅ Nộp bài thành công!');
        } catch (error) {
            alert('❌ Lỗi nộp bài: ' + (error.response?.data?.message || 'Vui lòng thử lại'));
        }
    };

    if (!exam) return <p style={{ textAlign: 'center' }}>Đang tải đề thi...</p>;

    return (
        // Bọc toàn bộ trang thi bằng các lệnh chặn Copy, Paste, và Right Click
        <div
            onCopy={(e) => { e.preventDefault(); alert('🚫 Tính năng Copy đã bị khóa!'); }}
            onPaste={(e) => { e.preventDefault(); alert('🚫 Tính năng Paste đã bị khóa!'); }}
            onCut={(e) => { e.preventDefault(); alert('🚫 Tính năng Cut đã bị khóa!'); }}
            onContextMenu={(e) => { e.preventDefault(); alert('🚫 Không được dùng chuột phải trong phòng thi!'); }}
            style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial', userSelect: 'none' }}
            // Thêm userSelect: 'none' để không cho phép bôi đen văn bản
        >
            <div style={{ position: 'sticky', top: 0, background: 'white', padding: '10px', borderBottom: '2px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                <h2>📝 {exam.title}</h2>
                <h3 style={{ color: timeLeft < 60 ? 'red' : 'blue' }}>
                    ⏳ Thời gian: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </h3>
            </div>

            {/* Hiển thị số lần cảnh báo gian lận */}
            {!isSubmitted && cheatWarnings > 0 && (
                <div style={{ background: '#ffeeba', color: '#856404', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontWeight: 'bold' }}>
                    ⚠️ Cảnh báo: Bạn đã chuyển tab {cheatWarnings}/3 lần.
                </div>
            )}

            {!isSubmitted ? (
                <>
                    {exam.questions.map((q, index) => (
                        <div key={q._id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <p><strong>Câu {index + 1}:</strong> {q.content}</p>

                            {q.passageText && (
                                <div style={{ background: '#f9f9f9', padding: '10px', borderLeft: '4px solid #4A90E2', marginBottom: '15px' }}>
                                    <em>{q.passageText}</em>
                                </div>
                            )}

                            {q.type === 'short' ? (
                                <input
                                    type="text"
                                    placeholder="Nhập câu trả lời..."
                                    onChange={(e) => handleAnswerChange(q._id, e.target.value, 'short')}
                                    style={{ width: '100%', padding: '10px', marginTop: '10px' }}
                                    onPaste={(e) => e.preventDefault()} // Chặn paste kể cả trong ô input
                                />
                            ) : (
                                <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                                    {q.options.map(opt => (
                                        <label key={opt.id} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type={q.type === 'multiple' ? "checkbox" : "radio"}
                                                name={q._id}
                                                checked={q.type === 'multiple' ? (answers[q._id] || []).includes(opt.id) : answers[q._id] === opt.id}
                                                onChange={() => handleAnswerChange(q._id, opt.id, q.type)}
                                                style={{ marginRight: '10px' }}
                                            />
                                            {opt.id}. {opt.text}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={() => handleSubmit(false)}
                        style={{ width: '100%', padding: '15px', background: '#28A745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        📤 NỘP BÀI THI
                    </button>
                </>
            ) : (
                <div style={{ textAlign: 'center', marginTop: '50px', padding: '40px', border: '2px solid #28A745', borderRadius: '15px' }}>
                    <h1 style={{ color: '#28A745' }}>🎉 ĐÃ HOÀN THÀNH!</h1>
                    <h2>Điểm số của bạn: <span style={{ fontSize: '48px', color: 'red' }}>{score}</span></h2>
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>Quay về trang chủ</button>
                </div>
            )}
        </div>
    );
};

export default ExamPage;