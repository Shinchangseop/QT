const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.connect()
  .then(() => console.log('PostgreSQL에 연결됨'))
  .catch((err) => console.error('연결 실패:', err.stack));

module.exports = client;
