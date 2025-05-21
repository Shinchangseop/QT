import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function EditList() {
  const [quizzes, setQuizzes] = useState([]);
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const storedNickname = localStorage.getItem('nickname');
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (storedNickname) setNickname(storedNickname);

  const url = userId === '2' 
    ? '/api/quiz/list/all' 
    : `/api/quiz/list/${userId}`;

  fetch(url)
    .then(res => res.json())
    .then(data => setQuizzes(data))
    .catch(err => {
      console.error('퀴즈 목록 조회 실패:', err);
      alert('퀴즈 목록을 불러오지 못했습니다.');
    });

  }, []);

  const formatDate = (utcDateStr) => {
    const date = new Date(utcDateStr);
    const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const year = kst.getFullYear();
    const month = String(kst.getMonth() + 1).padStart(2, '0');
    const day = String(kst.getDate()).padStart(2, '0');
    const hour = String(kst.getHours()).padStart(2, '0');
    const minute = String(kst.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}, ${hour}:${minute}`;
  };

  const handleDelete = (quizId) => {
    const confirmed = window.confirm('정말 삭제하시겠습니까? 되돌릴 수 없습니다.');
    if (!confirmed) return;

    fetch(`/api/quiz/delete/${quizId}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error('삭제 실패');
        setQuizzes(prev => prev.filter(q => q.quiz_id !== quizId));
      })
      .catch((err) => {
        console.error(err);
        alert('삭제 중 오류가 발생했습니다.');
      });
  };

  return (
    <Layout>
      <div style={{ padding: '100px 40px 40px', minHeight: '100vh' }}>
        <h2 style={{ textAlign: 'center' }}>
          {nickname || '(유저명)'} 님의 퀴즈
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginTop: '30px'
          }}
        >
          {quizzes.map((quiz) => {
            const parts = [];
            if (quiz.text_count > 0) parts.push(`텍스트 ${quiz.text_count}개`);
            if (quiz.image_count > 0) parts.push(`이미지 ${quiz.image_count}개`);
            if (quiz.sound_count > 0) parts.push(`사운드 ${quiz.sound_count}개`);
            const problemSummary = parts.join(', ');

            return (
              <div
                key={quiz.quiz_id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  position: 'relative',
                  minHeight: '110px'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '6px' }}>
                  {quiz.title}
                </div>

                {problemSummary && (
                  <div style={{ marginTop: '10px', fontSize: '14px' }}>
                    {problemSummary}
                  </div>
                )}

                <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                  최근 수정일: {formatDate(quiz.updated_at)}
                </div>

                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                    <button
                        onClick={() => navigate(`/edit/${quiz.quiz_id}`)}
                        style={{
                        backgroundColor: '#f4f4f4',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f4f4f4')}
                    >
                        🛠
                    </button>
                    <button
                        onClick={() => handleDelete(quiz.quiz_id)}
                        style={{
                        backgroundColor: '#f4f4f4',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f4f4f4')}
                    >
                        🗑
                    </button>
                </div>
              </div>
            );
          })}

          <div
            onClick={() => navigate('/edit/new')}
            style={{
              background: '#f0f0f0',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              cursor: 'pointer',
              minHeight: '110px'
            }}
          >
            ＋
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default EditList;
