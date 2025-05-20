// authRoutes.js
const express = require('express');
const client = require('./db');
const router = express.Router();

const fetch = require('node-fetch'); // 필요 시 설치: npm install node-fetch

router.post('/discord-login', async (req, res) => {
  const { code } = req.body;
  console.log('[🔄 디스코드 로그인 요청 도착]');
  console.log('[📩 받은 code]', code);
  console.log('[🔐 Client ID]', process.env.DISCORD_CLIENT_ID);
  console.log('[🔐 Client Secret]', process.env.DISCORD_CLIENT_SECRET);
  console.log('[🔐 Redirect URI]', process.env.DISCORD_REDIRECT_URI);

  try {
    // 1. Discord 토큰 요청
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log('[🟢 토큰 응답]', tokenData);

    const accessToken = tokenData.access_token;

    // 2. Discord 사용자 정보 요청
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const user = await userRes.json();
    console.log('[👤 유저 정보]', user);

    const { username, email, id: discordId } = user;

    // 3. 사용자 확인 또는 생성
    const userCheck = await client.query(
      'SELECT user_id FROM "User" WHERE email = $1',
      [email]
    );

    let userId;
    if (userCheck.rows.length === 0) {
      const insertRes = await client.query(
        'INSERT INTO "User" (username, email, auth_type) VALUES ($1, $2, $3) RETURNING user_id',
        [username, email, 'discord']
      );
      userId = insertRes.rows[0].user_id;
    } else {
      userId = userCheck.rows[0].user_id;
    }

    res.json({ user_id: userId, username });
  } catch (err) {
    console.error('🛑 디스코드 로그인 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});


router.post('/kakao-login', async (req, res) => {
  console.log('[카카오 로그인 요청] req.body:', req.body); // ✅ 여기에 찍기
  const { nickname } = req.body;

  try {
    const userCheck = await client.query(
      'SELECT user_id FROM "User" WHERE username = $1',
      [nickname]
    );

    let userId;

    if (userCheck.rows.length === 0) {
      // 🔥 신규 가입 처리
      const insertRes = await client.query(
        'INSERT INTO "User" (username, email, auth_type) VALUES ($1, $2, $3) RETURNING user_id',
        [nickname, `${nickname}@kakao.com`, 'kakao']
      );
      userId = insertRes.rows[0].user_id;
    } else {
      userId = userCheck.rows[0].user_id;
    }

    res.json({ user_id: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});


router.post('/google-login', async (req, res) => {
  const { name, email } = req.body;
  console.log('[구글 로그인 요청]', name, email); // 디버깅용

  try {
    const userCheck = await client.query(
      'SELECT user_id FROM "User" WHERE email = $1',
      [email]
    );

    let userId;
    if (userCheck.rows.length === 0) {
      const insertRes = await client.query(
        'INSERT INTO "User" (username, email, auth_type) VALUES ($1, $2, $3) RETURNING user_id',
        [name, email, 'google']
      );
      userId = insertRes.rows[0].user_id;
    } else {
      userId = userCheck.rows[0].user_id;
    }

    res.json({ user_id: userId });
  } catch (err) {
    console.error('🛑 구글 로그인 서버 오류:', err);
    res.status(500).json({ error: "서버 오류" });
  }
});

  
  

module.exports = router;

