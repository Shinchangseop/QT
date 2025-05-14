import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import './App.css';

function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  const nickname = localStorage.getItem('nickname');

  const handleLogout = () => {
    localStorage.removeItem('nickname');
    navigate('/'); // 로그아웃 후 /로 이동
  };

  const handleQuizManagement = () => {
    navigate('/edit'); // 퀴즈 관리 버튼 클릭 시 /edit 페이지로 이동
  };

  return (
    <div className="container">
      <header className="fixed-logo center-logo" onClick={handleLogoClick}>
        <img src={logo} alt="QT Logo" className="logo-img" />
      </header>
      {nickname && (
        <div className="user-info">
          <span className="user-nickname">{nickname}님</span>
          <button className="quiz-management-btn" onClick={handleQuizManagement}>퀴즈 관리</button>
          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>
      )}
      {children}
    </div>
  );
}

export default Layout;
