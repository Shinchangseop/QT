const express = require('express');
const router = express.Router();
const { addQuestion } = require('./questionController');

// POST 요청을 처리하는 라우터
router.post('/add', addQuestion);

module.exports = router;
