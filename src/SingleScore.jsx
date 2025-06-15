import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './App.css';

function SingleScore() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizId, quizTitle, total, score, timeLimited, hintEnabled, hintCount } = location.state || {};

  if (!location.state) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>잘못된 접근입니다.</h2>
          <button className="btn-orange" onClick={() => navigate('/')}>처음으로</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '24px' }}>{quizTitle}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 24px', 
            backgroundColor: '#fff4e6',
            padding: '24px 32px',
            borderRadius: '16px',
            fontSize: '17px',
            width: 'fit-content',
            margin: '0 auto'
          }}
        >
          <p>총 문제 수 : {total}</p>
          <p>정답률 : {total > 0 ? Math.round((score.correct / total) * 100) : 0}%</p>
          <p>푼 문제 : {score.solved}</p>
          <p>시간 제한 : {timeLimited ? '있음' : '없음'}</p>
          <p>맞은 문제 : {score.correct}</p>
          <p>힌트 기능 : {hintEnabled ? '사용함' : '사용 안함'}</p>
          <p>틀린 문제 : {score.wrong}</p>
          <p>힌트 사용 횟수 : {hintCount}</p>
        </div>
  
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button className="btn-orange" onClick={() => navigate('/')}>처음으로</button>
          <button
                className="btn-orange"
                onClick={() => navigate(`/single/${quizId}/${total}/${timeLimited ? 't' : 'f'}/${hintEnabled ? 't' : 'f'}`)}
                >
                재도전
                </button>

        </div>
      </div>
    </Layout>
  );
}

export default SingleScore;
