import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import kakaoLogo from './assets/kakao.svg';
import googleLogo from './assets/google.svg';
import discordLogo from './assets/discord.svg';
import { useGoogleLogin } from '@react-oauth/google';




function Signup() {
  const API = import.meta.env.VITE_API_BASE_URL;


  const handleDiscordLogin = () => {
    const clientId = '1359476172420939877';
    const redirectUri = encodeURIComponent(import.meta.env.VITE_DISCORD_REDIRECT_URI);
    const scope = 'identify email';
  
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`;
    window.location.href = discordAuthUrl;
  };

  const navigate = useNavigate();

  // ✅ useGoogleLogin은 여기서 호출해야 정상 작동함!
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse.access_token;
  
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const user = await userInfoRes.json();
        const { name, email } = user;

        const API = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${API}/api/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        });

        const data = await response.json();
        localStorage.setItem('nickname', name);
        localStorage.setItem('user_id', data.user_id);
  
        alert(`${name}님 환영합니다!`);
        navigate('/join');
      } catch (error) {
        console.error('구글 로그인 처리 실패 ❌', error);
        alert('로그인 중 오류 발생');
      }
    },
    onError: () => console.log('구글 로그인 실패 ❌'),
  });

  // ✅ 카카오 로그인
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('b9d59ec1e40e9370c445c7ad41275583');
      console.log('카카오 SDK 초기화 완료');
    }
  }, []);

  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      console.error("Kakao SDK가 로드되지 않았습니다.");
      return;
    }

    window.Kakao.Auth.login({
      scope: 'profile_nickname',
      success: function (authObj) {
        console.log('카카오 로그인 성공 ✅', authObj);

        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async function (res) {
            const nickname = res.properties?.nickname;

            if (nickname) {
              try {
                const response = await fetch(`${API}/api/auth/kakao-login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nickname }),
                });

                if (!response.ok) {
                  throw new Error('user_id 조회 실패');
                }

                const data = await response.json();
                localStorage.setItem('nickname', nickname);
                localStorage.setItem('user_id', data.user_id);

                alert(`${nickname}님 반가워요!`);
                navigate('/join');
              } catch (error) {
                console.error('user_id 가져오기 실패 ❌', error);
                alert('로그인 중 오류가 발생했습니다.');
              }
            } else {
              console.error("닉네임을 가져올 수 없습니다.");
            }
          },
          fail: function (error) {
            console.error('사용자 정보 가져오기 실패 ❌', error);
          },
        });
      },
      fail: function (err) {
        console.error('카카오 로그인 실패 ❌', err);
      },
    });
  };

  return (
    <div>
      <div className="sns-buttons">
        <button className="sns-btn kakao" onClick={handleKakaoLogin}>
          <img src={kakaoLogo} alt="Kakao" className="sns-icon" />
          카카오로 시작하기
        </button>
        <button className="sns-btn google" onClick={googleLogin}>
          <img src={googleLogo} alt="Google" className="sns-icon" />
          구글로 시작하기
        </button>
        <button className="sns-btn discord discord-btn" onClick={handleDiscordLogin}>
          <img src={discordLogo} alt="Discord" className="sns-icon" />
          로 시작하기
        </button>
      </div>
    </div>
  );
}

export default Signup;
