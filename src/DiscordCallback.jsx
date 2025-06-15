import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function DiscordCallback() {
  const navigate = useNavigate();
  const fetched = useRef(false); // 중복 실행 방지용

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    const fetchDiscordLogin = async () => {
      try {
        const res = await fetch('/api/auth/discord-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('nickname', data.username);
          localStorage.setItem('user_id', data.user_id);
          alert(`${data.username}님 환영합니다!`);
          navigate('/join');
        } else {
          console.error('로그인 실패:', data.error);
        }
      } catch (err) {
        console.error('서버 요청 오류:', err);
      }
    };

    if (!fetched.current && code) {
      fetched.current = true;
      fetchDiscordLogin();
    }
  }, [navigate]);

  return <div>디스코드 로그인 처리 중...</div>;
}

export default DiscordCallback;
