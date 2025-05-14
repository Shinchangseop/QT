const { Client } = require('pg');

const client = new Client({
  user: 'postgres',         // PostgreSQL 사용자명
  host: 'localhost',        // PostgreSQL 호스트
  database: 'qtdb',         // 데이터베이스 이름을 'qtdb'로 변경
  password: 'hoonz@001105', // 비밀번호
  port: 5432,               // PostgreSQL 기본 포트
});

client.connect()
  .then(() => console.log('PostgreSQL에 연결됨'))
  .catch((err) => console.error('연결 실패:', err.stack));

module.exports = client;
