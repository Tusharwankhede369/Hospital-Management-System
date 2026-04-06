const axios = require('axios');

const PYTHON_BASE_URL = process.env.PYTHON_BASE_URL || 'http://127.0.0.1:8000';

const analyzeWithPython = async (text, filePath) => {
  const res = await axios.post(`${PYTHON_BASE_URL}/analyze`, {
    text,
    file_path: filePath || null
  });
  return res.data;
};

const chatWithPython = async (message, user) => {
  const res = await axios.post(`${PYTHON_BASE_URL}/chat`, {
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

