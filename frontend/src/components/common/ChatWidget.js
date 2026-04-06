import React, { useState } from 'react';
import api from '../../api';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi, I am the HMS hospital AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e && e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { from: 'user', text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/chat', { message: text });
      const answer = res.data?.answer || 'Sorry, I could not answer that.';
      setMessages(prev => [...prev, { from: 'bot', text: answer }]);
    } catch (err) {
      let display = err.response?.data?.message || err.message || 'Error talking to AI assistant.';
      if (err.response?.status === 401) display = 'Please log in to use the AI assistant.';
      else console.error('Chat error:', err.response?.data || err.message);
      setMessages(prev => [...prev, { from: 'bot', text: display }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 96,
          height: 96,
          borderRadius: '999px',
          border: 'none',
          background: 'transparent',
          padding: 0,
          boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Open HMS AI assistant"
      >
        <DotLottieReact
          src="https://lottie.host/4aa76622-ac44-46f4-a13c-adee304e4ec5/e7wputbnOS.lottie"
          stateMachineId="StateMachine1"
          style={{ width: 96, height: 96 }}
        />
      </button>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 92,
            width: 320,
            maxHeight: 420,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(15,23,42,0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #e2e8f0',
              background: '#0f172a',
              color: '#e5e7eb'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>HMS Hospital AI Assistant</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Ask about doctors, timings, lab reports and more.</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: '10px 12px',
              overflowY: 'auto',
              fontSize: 13,
              background: '#f8fafc'
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '6px 9px',
                    borderRadius: 12,
                    background: m.from === 'user' ? '#2563eb' : '#ffffff',
                    color: m.from === 'user' ? '#ffffff' : '#0f172a',
                    boxShadow: '0 4px 10px rgba(15,23,42,0.12)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Assistant is typing...</div>
            )}
          </div>
          <form onSubmit={sendMessage} style={{ padding: '8px 10px', borderTop: '1px solid #e2e8f0' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 999,
                border: '1px solid #cbd5f5',
                fontSize: 13
              }}
            />
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

