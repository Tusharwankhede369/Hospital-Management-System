const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { chatWithPython } = require('../services/pythonClient');

// @route   POST /api/chat
// @desc    HMS AI chatbot (for hospital info, lab questions, etc.)
// @access  Private (any logged-in user)
router.post('/', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    const data = await chatWithPython(message, req.user);
    res.json({ answer: data.answer || '' });
  } catch (error) {
    console.error('Chat error:', error.message);
    const isConnRefused = error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED');
    const msg = isConnRefused
      ? 'AI service is unavailable. Please ensure the Python service is running (port 8000).'
      : (error.response?.data?.detail || error.message || 'Failed to get response from AI assistant.');
    res.status(500).json({ message: msg });
  }
});

module.exports = router;

