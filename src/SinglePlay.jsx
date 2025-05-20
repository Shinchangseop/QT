import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './App.css';
import ReactPlayer from 'react-player';
import YouTube from 'react-youtube';

import bellSound from './assets/sound/bell.mp3';
import countdown10 from './assets/sound/countdown10.wav';
import failSound from './assets/sound/FAIL.MP3';
import successSound from './assets/sound/SUCCESS.mp3';
import wrongSound from './assets/sound/SCORE_ALARM.mp3';



function SinglePlay() {
  const { quizId, count, time, hint } = useParams();
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(time === 't' ? 30 : null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [messageDetail, setMessageDetail] = useState('');
  const [score, setScore] = useState({ solved: 0, correct: 0, wrong: 0 });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();
  const timerRef = useRef(null); 
  const [player, setPlayer] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const API = import.meta.env.VITE_API_BASE_URL;
  const countdownRef = useRef(null);
  const bellAudioRef = useRef(new Audio(bellSound));
  const [introVisible, setIntroVisible] = useState(true);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const isCountdownPlaying = timer === 10;
  const isCountdownRef = useRef(false);

  const audioRef = useRef(null);

  const playSound = (audioFile) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioFile);
    audioRef.current = audio;
    audio.load();
    audio.play().catch(err => {
      console.warn('❌ 재생 실패:', err.message);
    });
  };


  const replaySound = () => {
    if (player && typeof startTime === 'number') {
      player.seekTo(startTime);
      player.playVideo();
    }
  };

  const onReady = (event) => {
    const duration = event.target.getDuration(); // 전체 길이 (초)
    let start = 0;

    if (duration < 60) {
      start = 0;
    } else if (duration < 120) {
      start = 15;
    } else {
      const min = Math.floor(duration * 0.05);
      const max = Math.floor(duration * 0.5);
      start = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    setStartTime(start);
    event.target.seekTo(start);
    event.target.playVideo();
    setPlayer(event.target);
  };

  const extractYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : '';
  };

  const currentQuestion = questionsLoaded && !introVisible && currentIndex < questions.length
    ? questions[currentIndex]
    : null;
  // console.log('📦 현재 문제:', currentQuestion);

  const [audioAllowed, setAudioAllowed] = useState(false);

  useEffect(() => {
    if (questions.length > 0 && !questionsLoaded) {
      setQuestionsLoaded(true);
    }
  }, [questions]);

  useEffect(() => {
    if (questionsLoaded) {
      const introDelay = setTimeout(() => {
        setIntroVisible(false);
      }, 3000);
      return () => clearTimeout(introDelay);
    }
  }, [questionsLoaded]);

  useEffect(() => {
  const allowAudio = () => {
    if (bellAudioRef.current) {
      bellAudioRef.current.play().then(() => {
        bellAudioRef.current.pause();
        bellAudioRef.current.currentTime = 0;
        setAudioAllowed(true);
        console.log('🔊 브라우저가 오디오 허용함');
      }).catch(e => {
        console.warn('🔇 브라우저 오디오 허용 실패:', e.message);
      });
    }

    window.removeEventListener('click', allowAudio);
  };

    window.addEventListener('click', allowAudio);
  }, []);

  useEffect(() => {
    fetch(`/api/quiz/${quizId}`)
      .then(res => res.json())
      .then(data => setQuizTitle(data.title));

    fetch(`/api/quiz/${quizId}/questions`)
      .then(res => res.json())
      .then(data => {
        console.log('📦 받아온 질문:', data);
        const filtered = data.filter(q => q.type === 'text' || q.type === 'image' || q.type === 'sound');
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        const limited = shuffled.slice(0, parseInt(count));
        console.log('📦 최종 질문:', limited);
        setQuestions(limited);
      });
  }, [quizId, count]);

  useEffect(() => {
    if (introVisible) return; // 🎯 intro일 때는 타이머 금지

    if (time === 't' && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev === 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [time, timer, introVisible]);


  useEffect(() => {
    if (currentQuestion?.type === 'sound') {
      setTimer(60);
    } else if (time === 't') {
      setTimer(20);
    }
  }, [currentQuestion]);
  

  useEffect(() => {
    if (!introVisible) {
      inputRef.current?.focus();
    }
  }, [currentIndex, message, introVisible]);

  useEffect(() => {
    if (time === 't' && currentQuestion?.type !== 'sound') {
      if (timer === 10) {
        isCountdownRef.current = true;
        playSound(countdown10);
      } else if (timer < 10) {
        isCountdownRef.current = false;
      }
    }
  }, [timer, currentQuestion]);

  useEffect(() => {
    if (!introVisible && currentIndex === 0 && currentQuestion?.type !== 'sound' && audioAllowed) {
      playSound(bellSound);
    }
  }, [introVisible, currentIndex, currentQuestion, audioAllowed]);

  const stopCountdownSound = () => {
    if (countdownRef.current) {
      countdownRef.current.pause();
      countdownRef.current = null;
    }
    isCountdownRef.current = false;
  };

  const saveResultToDB = async (finalScore) => {
    await fetch('/api/quiz/result/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: localStorage.getItem('user_id') || null,
        quiz_id: quizId,
        total_questions: questions.length,
        solved: finalScore.solved,
        correct: finalScore.correct,
        wrong: finalScore.wrong,
        time_limited: time === 't',
        hint_enabled: hint === 't',
        hint_count: hintCount
      })
    });
  };

  const goToNext = async (finalScore = score) => {
    stopCountdownSound();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      await saveResultToDB(finalScore);
      navigateToScore(finalScore);
    } else {
      setHintUsed(false);
      setShowHint(false);
      setInputAnswer('');
      setTimer(time === 't' ? 30 : null);
      setMessage('');
      setMessageType('');
      setMessageDetail('');
      setCurrentIndex(nextIndex);
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;
    const userAns = inputAnswer.trim().toLowerCase();

    if (userAns === '!힌트') {
      handleHint();
      setInputAnswer('');
      return;
    }
    if (userAns === '!스킵') {
      handleSkip();
      setInputAnswer('');
      return;
    }



    const answers = currentQuestion.answer.split('/').map(a => a.trim().toLowerCase());
    const correct = answers.includes(userAns);
    stopCountdownSound();
    
    if (correct) {
      clearInterval(timerRef.current);
      const updated = { solved: score.solved + 1, correct: score.correct + 1, wrong: score.wrong };
      setScore(updated);
      playSound(successSound);
      showMessage('정답!', 'correct');
      setTimeout(() => goToNext(updated), 1500);
    } else {
      stopCountdownSound(); // 위치 이동
      if (!isCountdownRef.current) {
        playSound(wrongSound);
      }
      showMessage('오답!', 'wrong');
      setInputAnswer('');
    }
  };

  const handleTimeout = () => {
    stopCountdownSound();
    const updated = { solved: score.solved + 1, correct: score.correct, wrong: score.wrong + 1 };
    setScore(updated);
    playSound(failSound);
    showMessage('시간 초과!', 'timeout', `정답: ${currentQuestion.answer.split('/')[0]}`);
    setTimeout(() => goToNext(updated), 2500);
  };

  const handleSkip = () => {
    stopCountdownSound();
    const updated = { solved: score.solved + 1, correct: score.correct, wrong: score.wrong + 1 };
    setScore(updated);
    playSound(failSound);
    showMessage('스킵!', 'skip', `정답: ${currentQuestion.answer.split('/')[0]}`);
    setTimeout(() => goToNext(updated), 2500);
  };

  const navigateToScore = (finalScore) => {
    navigate('/single/score', {
      state: {
        quizId, // ✅ 이거 추가
        quizTitle,
        total: questions.length,
        score: finalScore,
        timeLimited: time === 't',
        hintEnabled: hint === 't',
        hintCount
      }
    });
  };

  const handleHint = () => {
    if (hintUsed || !currentQuestion) return;
    setHintUsed(true);
    setHintCount(prev => prev + 1);
    const ans = currentQuestion.answer;
    const method = Math.random() > 0.5 ? 'first' : 'initial';
    let hintText = method === 'first'
      ? '첫 글자: ' + ans[0]
      : '초성: ' + getInitials(ans);
    setShowHint(hintText);
  };

  const getInitials = (text) => {
    const CHOSEONG = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    return Array.from(text).map(char => {
      const code = char.charCodeAt(0) - 0xAC00;
      if (code < 0 || code > 11171) return char;
      const chosung = Math.floor(code / 588);
      return CHOSEONG[chosung];
    }).join('');
  };

  const showMessage = (text, type, detail = '') => {
    setMessage(text);
    setMessageType(type);
    setMessageDetail(detail);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
      setMessageDetail('');
    }, type === 'timeout' || type === 'skip' ? 3000 : 2000);
  };

  const getYoutubeSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const [min, sec] = timeStr.split(':').map(Number);
    return min * 60 + sec;
  };

  return (
    <Layout>
      <div style={{ width: '80%', backgroundColor: '#fff4e6', padding: '20px', marginTop: '0px', borderRadius: '20px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ backgroundColor: '#fdebd0', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <h2 style={{ margin: 0 }}>{quizTitle}</h2>
            <div style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '60px' }}>
              <span>{currentIndex + 1}/{count}</span>
              <span>{time === 'f' ? '시간 무제한' : `${timer}초`}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <div
              style={{
                backgroundColor: 'white',
                flex: 1,
                borderRadius: '12px',
                boxShadow: '0 0 6px rgba(0,0,0,0.1)',
                minHeight: '306px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontSize: message ? '38px' : '24px',
                fontWeight: 'bold',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
                color: messageType === 'correct' ? 'green' : message ? 'red' : 'black'
              }}
            >
              {message ? (
  <>
    <div>{message}</div>
    {messageDetail && <div style={{ fontSize: '14px', color: 'black', marginTop: '8px' }}>{messageDetail}</div>}
  </>
                ) : introVisible ? (
                  '🎬 잠시 후 퀴즈가 시작됩니다...'
                ) : !currentQuestion ? (
                  '문제를 불러오는 중...'
                ) : currentQuestion.type === 'sound' ? (
                  <>
                    <span
                      onClick={replaySound}
                      style={{ fontSize: '32px', cursor: 'pointer', marginBottom: '12px' }}
                    >
                      🔊
                    </span>
                    <YouTube
                      videoId={extractYouTubeId(currentQuestion.media_url)}
                      onReady={onReady} // 👈 함수 이름 확인
                      opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0 } }}
                    />

                    <div>{currentQuestion.text_content}</div>
                  </>
                ) : currentQuestion.type === 'image' ? (
                  <>
                    <img
                      src={`${API}${currentQuestion.media_url}`}
                      alt="문제 이미지"
                      style={{ maxWidth: '50%', maxHeight: '240px', marginBottom: '12px', borderRadius: '8px', objectFit: 'contain' }}
                    />
                    <div>{currentQuestion.text_content}</div>
                  </>
                ) : (
                  <div>{currentQuestion.text_content}</div>
                )}


              {showHint && !message && (
                <div style={{ marginTop: '16px', fontSize: '16px', color: '#666', position: 'absolute', bottom: '16px' }}>
                  {showHint}
                </div>
              )}
            </div>

              <div>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="정답 입력"
                    disabled={!!message}
                    style={{ flex: 1, border: 'none', fontSize: '16px', padding: '8px' }}
                  />
                  <button
                    onClick={handleSubmit}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                    ✏️
                  </button>
                </div>
              </div>
            </div>

            <div style={{ width: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', boxShadow: '0 0 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px', textAlign: 'center' }}>현재 점수</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                  <li>• 푼 문제 : {score.solved}</li>
                  <li>• 맞은 문제 : {score.correct}</li>
                  <li>• 틀린 문제 : {score.wrong}</li>
                  <li>• 정답률 : {score.solved > 0 ? Math.round((score.correct / score.solved) * 100) : 0}%</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                {hint === 't' && (
                  <button
                    onClick={handleHint}
                    disabled={hintUsed}
                    style={{ backgroundColor: hintUsed ? '#ccc' : '#f4a261', color: 'white', fontSize: '16px', padding: '10px', borderRadius: '8px', border: 'none', cursor: hintUsed ? 'not-allowed' : 'pointer' }}>
                    💡 힌트
                  </button>
                )}
                <button onClick={handleSkip} style={{ backgroundColor: '#f4a261', color: 'white', fontSize: '16px', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  ⏩ 스킵
                </button>
                <button onClick={() => setShowExitConfirm(true)} style={{ backgroundColor: '#f4a261', color: 'white', fontSize: '16px', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  ❌ 나가기
                </button>
              </div>
            </div>

          </div>
        </div>

        {showExitConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ marginBottom: '16px' }}>정말 나가시겠습니까?</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button className="btn-orange" onClick={() => navigate('/')}>예</button>
                <button className="btn-orange" onClick={() => setShowExitConfirm(false)}>아니오</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );


}



export default SinglePlay;
