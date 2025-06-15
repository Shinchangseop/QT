import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Signup from './Signup';
import Layout from './Layout';

import main01 from './assets/main_01.png';
import main02 from './assets/main_02.png';
import main03 from './assets/main_03.png';
import main04 from './assets/main_04.png';
import main05 from './assets/main_05.png';
import main06 from './assets/main_06.png';
import main07 from './assets/main_07.png';
import main08 from './assets/main_08.png';

const images = [main01, main02, main03, main04, main05, main06, main07, main08];

function App() {
  const navigate = useNavigate();
  const nickname = localStorage.getItem('nickname');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (nickname) {
      navigate('/join');
    }
  }, [navigate, nickname]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('nickname');
    navigate('/');
  };

  return (
    <Layout>
      <div className="main-container">
        <div className="left-slideshow">
          <div className="slideshow-wrapper">
            <div className="slide-container">
              <img
                src={images[currentImageIndex]}
                alt={`슬라이드 ${currentImageIndex + 1}`}
                className="slide-image"
              />
            </div>
          </div>
        </div>
        <div className="right-login">
          {nickname ? (
            <button onClick={handleLogout} className="logout-btn">
              로그아웃
            </button>
          ) : (
            <div className="signup-container">
              <h1 className="signup-title">SNS 계정으로 시작하기</h1>
              <Signup />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default App;
