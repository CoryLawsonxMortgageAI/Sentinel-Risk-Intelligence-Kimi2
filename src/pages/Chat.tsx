import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bot, Send, User, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { api, type ChatMessage } from '../api/client';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const resp = await api.sendChat(userMsg, newMessages.slice(0, -1));
      setMessages([...newMessages, { role: 'assistant', content: resp.content }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const suggestions = [
    'Analyze DSCR for a $450K rental property with $3,200 monthly rent',
    'What are the red flags in a non-arms-length transaction?',
    'Explain LLC borrower requirements for DSCR loans',
    'Compare 30-year fixed vs 5/1 ARM for investment property',
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f0f0' }}>
      <div style={{ backgroundColor: '#0f1d2d', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <a href="#/" style={{ color: '#fff', textDecoration: 'none' }}><ArrowLeft size={16} /></a>
        <Bot size={18} color="#10b981" />
        <div>
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>Tyler AI — Kimi 2.6</h1>
          <p style={{ margin: 0, fontSize: 9, color: '#6b7280', fontFamily: "'Courier New', monospace" }}>MORTGAGE UNDERWRITING INTELLIGENCE</p>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Bot size={32} color="#d1d5db" style={{ marginBottom: 12 }} />
              <h2 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 600, color: '#0f1d2d', fontFamily: 'Georgia, serif' }}>Tyler AI Assistant</h2>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: "'Courier New', monospace" }}>POWERED BY KIMI 2.6 — 1M CONTEXT WINDOW</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{ padding: '10px 12px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 11, color: '#374151', cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ maxWidth: 720, margin: '0 auto 12px auto', display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: msg.role === 'user' ? '#0f1d2d' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.role === 'user' ? <User size={14} color="#fff" /> : <Bot size={14} color="#10b981" />}
            </div>
            <div style={{ backgroundColor: msg.role === 'user' ? '#0f1d2d' : '#fff', color: msg.role === 'user' ? '#fff' : '#1f2937', padding: '10px 14px', borderRadius: 8, fontSize: 12, lineHeight: 1.6, maxWidth: '80%', border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={14} color="#10b981" /></div>
            <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d1d5db' }} />)}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ maxWidth: 720, margin: '12px auto', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 11 }}>
            <AlertTriangle size={14} />{error}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 20px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {messages.length > 0 && (
            <button onClick={() => copyToClipboard(messages.map(m => `${m.role}: ${m.content}`).join('\n\n'))} style={{ fontSize: 9, color: '#6b7280', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              {copied ? <CheckCircle size={10} color="#10b981" /> : <Copy size={10} />}{copied ? 'Copied' : 'Copy Transcript'}
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask Tyler about DSCR analysis, fraud detection, loan guidelines..." rows={1}
              style={{ flex: 1, fontSize: 12, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#374151', minHeight: 40, maxHeight: 120 }} />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 6, backgroundColor: input.trim() && !loading ? '#0f1d2d' : '#e5e7eb', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed' }}>
              <Send size={16} color={input.trim() && !loading ? '#fff' : '#9ca3af'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
