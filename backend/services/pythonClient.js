const axios = require('axios');

// Support both env var names:
// - PYTHON_BASE_URL (recommended; used in our deployment steps)
// - PYTHON_BASE_URL (legacy; if someone set the old name)
const PYTHON_BASE_URL =
  process.env.PYTHON_BASE_URL ||
  process.env.PYTHON_BASE_URL ||
  process.env.PYTHON_BASE_URL ||
  'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: PYTHON_BASE_URL,
  timeout: Number(process.env.PYTHON_TIMEOUT_MS || 20000) // 20s default
});

const analyzeWithPython = async (text, filePath) => {
  const res = await client.post('/analyze', {
    text,
    file_path: filePath || null
  });
  return res.data;
};

const chatWithPython = async (message, user) => {
  const res = await client.post('/chat', {
    message,
    user_id: user ? user._id || user.id : null,
    role: user ? user.role : null
  });
  return res.data;
};

module.exports = {
  analyzeWithPython,
  chatWithPython
};

