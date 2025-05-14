import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Signup from './Signup';
import Layout from './Layout';
import DiscordCallback from './DiscordCallback';


function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const nickname = localStorage.getItem('nickname');
    if (nickname) {
      navigate('/join');
    }
  }, [navigate]);

  const nickname = localStorage.getItem('nickname');

  const handleLogout = () => {
    localStorage.removeItem('nickname');
    navigate('/');
  };

  return (
    <Layout>
      <div className="container">
        {nickname && (
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        )}
        {!nickname && (
          <div className="signup-container">
            <h1 className="signup-title">SNS 계정으로 시작하기</h1>
            <Signup />
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
