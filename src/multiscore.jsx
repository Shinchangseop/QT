import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from './Layout';

function MultiScore() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.results || !state?.roomId) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>잘못된 접근입니다.</h2>
          <button className="btn-orange" onClick={() => navigate('/')}>처음으로</button>
        </div>
      </Layout>
    );
  }

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}등`;
  };

  return (
    <Layout>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '24px' }}>최종 결과</h2>
        <div style={{ background: '#fff4e6', padding: '20px', borderRadius: '12px' }}>
          {state.results.map(({ user, score }, idx) => (
            <p key={user} style={{ fontSize: '18px', margin: '10px 0' }}>
              {getMedalEmoji(idx + 1)} {user} - {score}점
            </p>
          ))}
        </div>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button className="btn-orange" onClick={() => navigate('/')}>처음으로</button>
          <button className="btn-orange" onClick={() => navigate(`/room/${state.roomId}`)}>대기실로</button>
        </div>
      </div>
    </Layout>
  );
}

export default MultiScore;
