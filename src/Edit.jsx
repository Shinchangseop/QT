import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './App.css';
import editNew from './assets/edit_new.webp';
import editFix from './assets/edit_fix.webp';

function Edit() {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const buttonStyle = (isHovered) => ({
    width: '180px',
    height: '220px',
    border: 'none',
    backgroundColor: isHovered ? '#f0f0f0' : 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '20px',
    borderRadius: '20px',
    transition: 'background-color 0.3s ease, transform 0.3s ease',
  });

  const imageStyle = (isHovered) => ({
    width: '140px',
    height: '140px',
    marginBottom: '14px',
    borderRadius: '24px',
    transition: 'transform 0.3s ease',
    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
  });

  const textStyle = (isHovered) => ({
    fontSize: '22px',
    fontWeight: 'bold',
    transition: 'transform 0.3s ease',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
  });

  return (
    <Layout>
      <div className="edit-container">
        <h1>퀴즈 관리</h1>
        <p>여기서 퀴즈를 추가하거나 수정할 수 있습니다.</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginTop: '50px' }}>
          {/* 퀴즈 제작 버튼 */}
          <div
            style={buttonStyle(hovered === 'new')}
            onMouseEnter={() => setHovered('new')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate('/edit/new')}
          >
            <img src={editNew} alt="퀴즈 제작" style={imageStyle(hovered === 'new')} />
            <span style={textStyle(hovered === 'new')}>퀴즈 제작</span>
          </div>

          {/* 퀴즈 관리 버튼 */}
          <div
            style={buttonStyle(hovered === 'fix')}
            onMouseEnter={() => setHovered('fix')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate('/edit/list')} 
          >
            <img src={editFix} alt="퀴즈 관리" style={imageStyle(hovered === 'fix')} />
            <span style={textStyle(hovered === 'fix')}>퀴즈 관리</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Edit;
