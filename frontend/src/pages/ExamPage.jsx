import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const ExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [timeLeft, setTimeLimit] = useState(0);
    const timerRef = useRef(null);

    // 1. Tải dữ liệu đề thi
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosClient.get(`/exams/${examId}`);
                setExam(res.data.exam);
                setQuestions(res.data.questions);
                setTimeLimit(res.data.exam.timeLimit * 60);
            } catch (err) {
                alert("❌ Không thể tải đề thi!");
                navigate('/dashboard');
            }
        };
        fetchData();
    }, [examId, navigate]);

    // 2. Logic nộp bài (Dùng useCallback để ổn định hàm khi đưa vào useEffect chống gian lận)
    const handleSubmit = useCallback(async () => {
        try {
            // Ngừng đếm ngược ngay khi nộp bài
            clearInterval(timerRef.current);

            const formattedAnswers = Object.keys(userAnswers).map(qId => ({
                questionId: qId,
                selectedOption: typeof userAnswers[qId] === 'string' ? userAnswers[qId] : undefined,
                selectedOptions: Array.isArray(userAnswers[qId]) ? userAnswers[qId] : undefined,
                answerText: typeof userAnswers[qId] === 'string' && questions.find(q => q._id === qId)?.type === 'short' ? userAnswers[qId] : undefined
            }));

            const res = await axiosClient.post(`/exams/${examId}/submit`, { answers: formattedAnswers });
            alert(`🎉 Nộp bài thành công! Điểm của bạn: ${res.data.score}`);
            navigate(`/result/${res.data.resultId}`);
        } catch (err) {
            alert("❌ Lỗi khi nộp bài!");
        }
    }, [examId, navigate, userAnswers, questions]);

    // 3. Bộ đếm ngược thời gian
    useEffect(() => {
        if (timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLimit(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && exam) {
            alert("⏰ Hết giờ làm bài! Hệ thống sẽ tự động nộp bài.");
            handleSubmit();
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, exam, handleSubmit]);

    // 4. --- TÍNH NĂNG CHỐNG GIAN LẬN NÂNG CAO ---
    useEffect(() => {
        // A. Chặn chuyển Tab/App - Tự động nộp bài ngay
        const handleVisibilityChange = () => {
            if (document.hidden) {
                alert("⛔ VI PHẠM: Bạn đã rời khỏi màn hình làm bài! Hệ thống tự động nộp bài.");
                handleSubmit();
            }
        };

        // B. Chặn chuột phải (Tránh Copy đề) [cite: 1066]
        const handleContextMenu = (e) => e.preventDefault();

        // C. Chặn các phím tắt gian lận (Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+S) [cite: 1066]
        const handleKeyDown = (e) => {
            if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's' || e.key === 'p')) {
                e.preventDefault();
                alert("⛔ Hành động bị cấm để đảm bảo tính công bằng!");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleSubmit]);

    // Xử lý chọn đáp án
    const handleAnswerChange = (qId, value, type) => {
        let newAnswers = { ...userAnswers };
        if (type === 'multiple') {
            let current = newAnswers[qId] || [];
            if (current.includes(value)) {
                newAnswers[qId] = current.filter(v => v !== value);
            } else {
                newAnswers[qId] = [...current, value];
            }
        } else {
            newAnswers[qId] = value;
        }
        setUserAnswers(newAnswers);
    };

    if (!exam) return <div style={{ textAlign: 'center', padding: '50px' }}>Đang chuẩn bị đề thi...</div>;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', position: 'relative', userSelect: 'none' }}>
            {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
            <div style={{ position: 'sticky', top: '10px', float: 'right', background: 'red', color: 'white', padding: '10px', borderRadius: '5px', fontWeight: 'bold', zIndex: 100 }}>
                ⏱ THỜI GIAN: {formatTime(timeLeft)}
            </div>

            <h1 style={{ textAlign: 'center' }}>📝 {exam.title}</h1>
            <p style={{ textAlign: 'center', color: '#666' }}>Học sinh: {JSON.parse(localStorage.getItem('user'))?.username}</p>
            <hr />

            {/* HIỂN THỊ CÂU HỎI */}
            {questions.map((q, index) => (
                <div key={q._id} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '10px', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>

                    {/* Hiển thị bài đọc/tựa đề chung một lần duy nhất cho cả nhóm  */}
                    {q.passageText && (
                        <div style={{ padding: '15px', background: '#f0f7ff', borderLeft: '5px solid #007bff', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>
                            <strong style={{ color: '#007bff' }}>📖 NỘI DUNG CHUNG:</strong> <br />
                            {q.passageText}
                        </div>
                    )}

                    <p style={{ fontSize: '18px' }}><strong>Câu {index + 1}:</strong> {q.content} ({q.points} điểm)</p>

                    {/* Câu hỏi trắc nghiệm [cite: 2075] */}
                    {q.type !== 'short' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {q.options.map(opt => (
                                <label key={opt._id} style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', transition: '0.2s', background: (q.type === 'multiple' ? (userAnswers[q._id] || []).includes(opt.id) : userAnswers[q._id] === opt.id) ? '#e3f2fd' : '#fff' }}>
                                    <input
                                        type={q.type === 'multiple' ? "checkbox" : "radio"}
                                        name={q._id}
                                        checked={q.type === 'multiple' ? (userAnswers[q._id] || []).includes(opt.id) : userAnswers[q._id] === opt.id}
                                        onChange={() => handleAnswerChange(q._id, opt.id, q.type)}
                                        style={{ marginRight: '10px' }}
                                    />
                                    <strong>{opt.id}.</strong> {opt.text}
                                </label>
                            ))}
                        </div>
                    ) : (
                        /* Câu hỏi trả lời ngắn [cite: 2075] */
                        <div style={{ marginTop: '10px' }}>
                            <input
                                type="text"
                                placeholder="Nhập câu trả lời của bạn vào đây..."
                                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
                                value={userAnswers[q._id] || ''}
                                onChange={(e) => handleAnswerChange(q._id, e.target.value, 'short')}
                            />
                        </div>
                    )}
                </div>
            ))}

            <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '100px' }}>
                <button
                    onClick={() => { if(window.confirm("Bạn có chắc chắn muốn nộp bài?")) handleSubmit(); }}
                    style={{ padding: '15px 60px', fontSize: '20px', background: '#28A745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                    📤 NỘP BÀI THI
                </button>
            </div>
        </div>
    );
};

export default ExamPage;