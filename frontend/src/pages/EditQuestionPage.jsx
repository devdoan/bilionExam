import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const EditQuestionPage = () => {
    const { examId, questionId } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState('');
    const [points, setPoints] = useState(1);
    const [passageText, setPassageText] = useState('');
    const [groupId, setGroupId] = useState('');
    const [type, setType] = useState('single');
    const [options, setOptions] = useState([
        { id: 'A', text: '' }, { id: 'B', text: '' },
        { id: 'C', text: '' }, { id: 'D', text: '' }
    ]);
    const [correctAnswer, setCorrectAnswer] = useState('A');
    const [penaltyRules, setPenaltyRules] = useState([]);
    const [newWrongCount, setNewWrongCount] = useState('');
    const [newDeductPoints, setNewDeductPoints] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const response = await axiosClient.get(`/questions/${questionId}`);
                const q = response.data.question;

                setContent(q.content);
                setPoints(q.points);
                setPassageText(q.passageText || '');
                setGroupId(q.groupId || '');
                setType(q.type);
                setOptions(q.options || [
                    { id: 'A', text: '' }, { id: 'B', text: '' },
                    { id: 'C', text: '' }, { id: 'D', text: '' }
                ]);
                setPenaltyRules(q.penaltyRules || []);

                // Xử lý đáp án đúng
                if (q.type === 'multiple' && typeof q.correctAnswer === 'string') {
                    setCorrectAnswer(q.correctAnswer.split(','));
                } else {
                    setCorrectAnswer(q.correctAnswer || 'A');
                }

                setLoading(false);
            } catch (error) {
                alert('❌ Không thể tải câu hỏi: ' + (error.response?.data?.message || error.message));
                navigate(`/exam-detail/${examId}`);
            }
        };
        fetchQuestion();
    }, [questionId, examId, navigate]);

    const addRule = () => {
        if (newWrongCount && newDeductPoints) {
            setPenaltyRules([...penaltyRules, {
                wrongCount: Number(newWrongCount),
                deductPoints: Number(newDeductPoints)
            }]);
            setNewWrongCount('');
            setNewDeductPoints('');
        }
    };

    const removeRule = (index) => {
        setPenaltyRules(penaltyRules.filter((_, idx) => idx !== index));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleCheckboxChange = (optionId) => {
        let currentAnswers = Array.isArray(correctAnswer) ? [...correctAnswer] : [];
        if (currentAnswers.includes(optionId)) {
            currentAnswers = currentAnswers.filter(id => id !== optionId);
        } else {
            currentAnswers.push(optionId);
        }
        setCorrectAnswer(currentAnswers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let finalAnswer = correctAnswer;
        if (Array.isArray(correctAnswer)) {
            finalAnswer = correctAnswer.join(',');
        }

        if (!finalAnswer || finalAnswer.toString().trim() === '') {
            alert('⚠️ Cảnh báo: Bạn chưa nhập hoặc chọn đáp án đúng cho câu này!');
            return;
        }

        const finalOptions = type === 'short' ? [] : options;

        try {
            await axiosClient.put(`/questions/${questionId}`, {
                content,
                points,
                passageText,
                groupId,
                type,
                options: finalOptions,
                correctAnswer: finalAnswer,
                penaltyRules
            });

            alert('✅ Cập nhật câu hỏi thành công!');
            navigate(`/exam-detail/${examId}`);
        } catch (error) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể cập nhật câu hỏi'));
        }
    };

    if (loading) {
        return <p style={{ padding: '20px', textAlign: 'center' }}>⏳ Đang tải dữ liệu câu hỏi...</p>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(`/exam-detail/${examId}`)}
                style={{ padding: '8px 15px', marginBottom: '20px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc', background: '#f8f9fa' }}
            >
                ⬅ Quay lại Đề thi
            </button>

            <h2 style={{ textAlign: 'center', color: '#4A90E2' }}>✏️ SỬA CÂU HỎI</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label><strong>Nội dung câu hỏi:</strong></label><br />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} required style={{ width: '100%', height: '80px' }} />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label><strong>Loại câu hỏi:</strong></label><br />
                        <select value={type} onChange={(e) => {
                            setType(e.target.value);
                            setCorrectAnswer(e.target.value === 'multiple' ? [] : 'A');
                        }} style={{ width: '100%', padding: '5px' }}>
                            <option value="single">Trắc nghiệm 1 đáp án</option>
                            <option value="multiple">Trắc nghiệm nhiều đáp án</option>
                            <option value="short">Trả lời ngắn (Tự viết)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label><strong>Điểm số cho câu này:</strong></label><br />
                        <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} style={{ width: '100%', padding: '5px' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label><strong>Mã nhóm:</strong></label><br />
                    <input type="text" value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="VD: READING_01" style={{ width: '100%', padding: '5px' }} />
                </div>

                {/* PHẦN CÀI ĐẶT LUẬT PHẠT */}
                <div style={{ padding: '15px', border: '1px dashed orange', marginBottom: '15px', backgroundColor: '#FFF9F0' }}>
                    <h4>⚙️ Quy tắc trừ điểm lũy tiến cho nhóm {groupId || 'này'}:</h4>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input type="number" placeholder="Số câu sai" value={newWrongCount} onChange={(e) => setNewWrongCount(e.target.value)} />
                        <input type="number" placeholder="Điểm trừ" value={newDeductPoints} onChange={(e) => setNewDeductPoints(e.target.value)} />
                        <button type="button" onClick={addRule}>➕ Thêm luật</button>
                    </div>
                    <ul style={{ fontSize: '14px' }}>
                        {penaltyRules.map((rule, idx) => (
                            <li key={idx}>
                                Sai {rule.wrongCount} câu - Trừ {rule.deductPoints} điểm
                                <button type="button" onClick={() => removeRule(idx)} style={{ marginLeft: '10px', color: 'red', cursor: 'pointer' }}>🗑️</button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label><strong>Văn bản bài đọc/Tựa đề chung:</strong></label><br />
                    <textarea value={passageText} onChange={(e) => setPassageText(e.target.value)} style={{ width: '100%', height: '100px' }} placeholder="Chỉ nhập ở câu đầu tiên của nhóm..." />
                </div>

                {type !== 'short' && (
                    <div style={{ marginBottom: '15px' }}>
                        <h4>Các đáp án:</h4>
                        {options.map((opt, index) => (
                            <div key={opt.id} style={{ marginBottom: '8px' }}>
                                <strong>{opt.id}: </strong>
                                <input type="text" value={opt.text} onChange={(e) => handleOptionChange(index, e.target.value)} required style={{ width: '85%', padding: '5px' }} />
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '15px', padding: '15px', background: '#E8F4FD' }}>
                    <label><strong>Đáp án đúng: </strong></label>
                    {type === 'short' ? (
                        <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Nhập đáp án chuẩn..." style={{ width: '70%', padding: '5px' }} />
                    ) : type === 'multiple' ? (
                        <div style={{ display: 'inline-block', marginLeft: '10px' }}>
                            {options.map(opt => (
                                <label key={opt.id} style={{ marginRight: '15px' }}>
                                    <input type="checkbox" checked={correctAnswer.includes(opt.id)} onChange={() => handleCheckboxChange(opt.id)} /> {opt.id}
                                </label>
                            ))}
                        </div>
                    ) : (
                        <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} style={{ padding: '5px' }}>
                            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.id}</option>)}
                        </select>
                    )}
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button type="submit" style={{ padding: '12px 25px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Lưu thay đổi</button>
                    <button type="button" onClick={() => navigate(`/exam-detail/${examId}`)} style={{ marginLeft: '15px', padding: '12px 25px', borderRadius: '5px', cursor: 'pointer' }}>Hủy bỏ</button>
                </div>
            </form>
        </div>
    );
};

export default EditQuestionPage;
