import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from './Layout';
import './App.css';

function EditNew() {
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const navigate = useNavigate();
  const { quizId } = useParams();
  const typeBoxRef = useRef(null);

  const isEditMode = !!quizId;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeBoxRef.current && !typeBoxRef.current.contains(e.target)) {
        setShowTypeSelect(false);
      }
    };
    if (showTypeSelect) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTypeSelect]);

  useEffect(() => {
    if (isEditMode) {
      fetch(`/api/quiz/${quizId}`)
        .then(res => res.json())
        .then(data => {
          setQuizTitle(data.title);

          const transformed = data.questions.map((q) => {
            const typeLabel = { text: '텍스트', image: '이미지', sound: '사운드' }[q.type];
            const firstAnswer = q.answer?.split('/')?.[0]?.trim() || '';
            return {
              type: q.type,
              title: firstAnswer ? `${firstAnswer}` : `새 ${typeLabel} 퀴즈`,
              question: q.text_content,
              answer: q.answer,
              imageFile: q.type === 'image' ? q.media_url : null,
              imageName: q.type === 'image' ? q.media_url : '',
              soundUrl: q.type === 'sound' ? q.media_url : '',
            };
          });

          setQuestions(transformed);
        })
        .catch(err => {
          console.error('퀴즈 로딩 실패:', err);
          alert('퀴즈 정보를 불러오지 못했습니다.');
        });
    }
  }, [quizId]);

  const handleAddQuestion = (type) => {
    const typeLabel = {
      text: '텍스트',
      image: '이미지',
      sound: '사운드'
    }[type];

    const newQuestion = {
      type,
      title: `새 ${typeLabel} 퀴즈`,
      question: '',
      answer: '',
      imageFile: null,
      imageName: '',
      soundUrl: ''
    };

    setQuestions(prev => [...prev, newQuestion]);
    setShowTypeSelect(false);
  };

  const handleRemoveQuestion = () => {
    if (selectedIndex === null) return;
    const updated = [...questions];
    updated.splice(selectedIndex, 1);
    const newIndex = updated.length === 0 ? null :
      selectedIndex >= updated.length ? updated.length - 1 : selectedIndex;
    setQuestions(updated);
    setSelectedIndex(newIndex);
  };

  const handleFieldChange = (field, value) => {
    if (selectedIndex === null) return;
    const updated = [...questions];
    updated[selectedIndex][field] = value;

    if (field === 'answer') {
      const typeLabel = {
        text: '텍스트',
        image: '이미지',
        sound: '사운드'
      }[updated[selectedIndex].type];
      const firstAnswer = value.split('/')[0].trim();
      updated[selectedIndex].title = firstAnswer || `새 ${typeLabel} 퀴즈`;
    }

    setQuestions(updated);
  };

  const handleSaveQuiz = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
  
    try {
      if (isEditMode) {
        await fetch(`/api/quiz/delete/${quizId}`, { method: 'DELETE' });
      }
  
      const quizData = {
        creator_id: parseInt(userId),
        title: quizTitle,
        created_at: new Date().toISOString(),
      };
  
      const quizResponse = await fetch('/api/quiz/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData),
      });
  
      if (!quizResponse.ok) throw new Error('퀴즈 저장에 실패했습니다.');
  
      const { quiz_id } = await quizResponse.json();
  
      const questionData = questions.map((q) => ({
        quiz_id,
        type: q.type,
        text_content: q.question,
        media_url: q.imageName || q.soundUrl || null,
        answer: q.answer,
      }));
  
      for (let data of questionData) {
        const questionResponse = await fetch('/api/question/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!questionResponse.ok) throw new Error('질문 저장에 실패했습니다.');
      }
  
      alert('퀴즈가 성공적으로 저장되었습니다!');
      navigate('/edit');
    } catch (err) {
      console.error(err);
      alert('퀴즈 저장 중 오류가 발생했습니다.');
    }
  };
  

  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleSort = () => {
    const newQuestions = [...questions];
    const draggedItem = newQuestions.splice(dragItem.current, 1)[0];
    newQuestions.splice(dragOverItem.current, 0, draggedItem);
    setQuestions(newQuestions);
    setSelectedIndex(dragOverItem.current);
  };

  const selectedQuestion = selectedIndex !== null ? questions[selectedIndex] : null;

  const buttonStyle = {
    width: '100%',
    height: '40px',
    fontSize: '15px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s'
  };

  const fileInputStyle = {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    width: '100%'
  };

  return (
    <Layout>
      <div style={{ display: 'flex', gap: '40px', padding: '100px 40px 40px', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px', minHeight: '600px' }}>
          <label style={{ textAlign: 'left' }}>
            <div>제목</div>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              style={{ width: '100%', height: '40px', fontSize: '16px' }}
            />
          </label>

          <label style={{ textAlign: 'left' }}>
            <div>문제 목록</div>
            <div style={{
              border: '1px solid black',
              height: '300px',
              overflowY: 'auto',
              padding: '10px',
              textAlign: 'left'
            }}>
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => (dragItem.current = idx)}
                  onDragEnter={() => (dragOverItem.current = idx)}
                  onDragEnd={handleSort}
                  onClick={() => setSelectedIndex(idx)}
                  style={{
                    marginBottom: '5px',
                    backgroundColor: selectedIndex === idx ? '#d3d3d3' : 'transparent',
                    padding: '6px',
                    cursor: 'pointer',
                    borderRadius: '6px'
                  }}
                >
                  {idx + 1}. {q.type === 'text' ? '텍스트' : q.type === 'image' ? '이미지' : '사운드'} - {q.title}
                </div>
              ))}
            </div>
          </label>

          <div style={{ display: 'flex', gap: '10px', height: '40px' }}>
            <div style={{ position: 'relative', width: '100%' }} ref={typeBoxRef}>
              <button style={buttonStyle} onClick={() => setShowTypeSelect(prev => !prev)}>
                문제 추가
              </button>
              {showTypeSelect && (
                <div style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: '0',
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '10px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  padding: '8px 0',
                  width: '100%',
                  zIndex: 10,
                }}>
                  {['text', 'image', 'sound'].map((value) => (
                    <div
                      key={value}
                      onClick={() => handleAddQuestion(value)}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      {value === 'text' ? '텍스트' : value === 'image' ? '이미지' : '사운드'}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleRemoveQuestion} style={buttonStyle}>문제 제거</button>
          </div>
        </div>

        <div style={{ width: '500px', minHeight: '420px' }}>
          {selectedQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedQuestion.type === 'sound' && (
                <label style={{ textAlign: 'left' }}>
                  <div>유튜브 URL</div>
                  <input
                    type="text"
                    value={selectedQuestion.soundUrl}
                    onChange={(e) => handleFieldChange('soundUrl', e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '16px' }}
                  />
                </label>
              )}

              {selectedQuestion.type === 'image' && (
                <label style={{ textAlign: 'left' }}>
                  <div>이미지 업로드</div>
                  <input
                    type="file"
                    accept="image/*"
                    style={fileInputStyle}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('image', file);

                        fetch('/api/upload/image', {
                          method: 'POST',
                          body: formData,
                        })
                          .then(res => res.json())
                          .then(data => {
                            handleFieldChange('imageName', data.imageUrl);
                            handleFieldChange('imageFile', URL.createObjectURL(file));
                          })
                          .catch(err => {
                            console.error('이미지 업로드 실패:', err);
                            alert('이미지 업로드에 실패했습니다.');
                          });
                      }
                    }}
                  />
                  {selectedQuestion.imageName && (
                    <div style={{ marginTop: '4px', fontSize: '13px', color: '#555' }}>
                      {selectedQuestion.imageName}
                    </div>
                  )}
                  {selectedQuestion.imageFile && (
                    <img
                      src={selectedQuestion.imageFile}
                      alt="미리보기"
                      style={{ marginTop: '10px', maxHeight: '100px', borderRadius: '8px' }}
                    />
                  )}
                </label>
              )}

              <label style={{ textAlign: 'left' }}>
                <div>질문</div>
                <textarea
                  value={selectedQuestion.question}
                  onChange={(e) => handleFieldChange('question', e.target.value)}
                  style={{
                    width: '100%',
                    height: selectedQuestion.type === 'text' ? '250px' : '120px',
                    fontSize: '16px',
                    resize: 'none'
                  }}
                />
              </label>

              <label style={{ textAlign: 'left' }}>
                <div>정답</div>
                <input
                  type="text"
                  value={selectedQuestion.answer}
                  onChange={(e) => handleFieldChange('answer', e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '16px' }}
                />
                <div style={{ fontSize: '12px', marginTop: '4px' }}>중복 정답은 '/'로 구분</div>
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSaveQuiz} style={buttonStyle}>저장</button>
                <button style={buttonStyle}>취소</button>
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.3, textAlign: 'center', marginTop: '150px' }}>
              문제를 선택하면 여기서 편집할 수 있어요
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EditNew;
