import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const AddQuestionPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState('');
    const [points, setPoints] = useState(1);
    const [passageText, setPassageText] = useState('');
    const [groupId, setGroupId] = useState('');
    const [type, setType] = useState('single'); // Mặc định là 1 đáp án đúng
    const [options, setOptions] = useState([
        { id: 'A', text: '' }, { id: 'B', text: '' },
        { id: 'C', text: '' }, { id: 'D', text: '' }
    ]);

    // Đáp án đúng có thể là String (single/short) hoặc Array (multiple)
    const [correctAnswer, setCorrectAnswer] = useState('A');

    // --- Quản lý quy tắc trừ điểm ---
    const [penaltyRules, setPenaltyRules] = useState([]);
    const [newWrongCount, setNewWrongCount] = useState('');
    const [newDeductPoints, setNewDeductPoints] = useState('');

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

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    // Xử lý chọn nhiều đáp án đúng (Checkbox)
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
        try {
            await axiosClient.post('/questions/create', {
                examId, content, points, passageText, groupId, type, options, correctAnswer, penaltyRules
            });
            alert('✅ Thêm câu hỏi thành công!');
            // Reset form nhưng giữ lại groupId/type để mẹ nhập tiếp các câu cùng loại
            setContent('');
            setPenaltyRules([]);
            if (type === 'multiple') setCorrectAnswer([]);
        } catch (error) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể thêm câu hỏi'));
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', color: '#4A90E2' }}>➕ THÊM CÂU HỎI & CÀI ĐẶT LUẬT</h2>
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
                            <li key={idx}>Sai {rule.wrongCount} câu - Trừ {rule.deductPoints} điểm</li>
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
                    <button type="submit" style={{ padding: '12px 25px', background: '#28A745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu & Thêm câu khác</button>
                    <button type="button" onClick={() => navigate('/dashboard')} style={{ marginLeft: '15px', padding: '12px 25px', borderRadius: '5px', cursor: 'pointer' }}>Xong (Về Dashboard)</button>
                </div>
            </form>
        </div>
    );
};

export default AddQuestionPage;