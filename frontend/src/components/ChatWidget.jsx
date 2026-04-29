import { useState, useRef, useEffect } from 'react'
import { Icon } from '../components'

const API = import.meta.env.VITE_API_URL || ''

const STARTERS = [
  "Which category has the highest amendment ratio?",
  "Top 5 vendors by total spend in FY2025",
  "Which department spends the most on IT?",
  "Show me sole-source contract trends",
  "Compare spending growth across provinces",
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your procurement data assistant. Ask me anything about Government of Canada contracts from FY2015–FY2026.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages, loading])

  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = text.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const resp = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: [] }),
      })
      const data = await resp.json()
      let answer = data.answer || 'I couldn\'t process that question.'

      // If we got tabular data, format a mini summary
      if (data.data && data.data.length > 0 && data.data.length <= 10) {
        const keys = Object.keys(data.data[0])
        const rows = data.data.map(r => keys.map(k => {
          const v = r[k]
          return typeof v === 'number' && v > 1000 ? `$${(v/1e6).toFixed(1)}M` : v
        }).join(' | ')).join('\n')
        answer += `\n\n📊 **Data:**\n${keys.join(' | ')}\n${rows}`
      }

      setMessages(prev => [...prev, { role: 'ai', text: answer }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Connection error. The AI service may be unavailable.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => setOpen(true)} title="AI Assistant">
        <Icon name="chat" size={24}/>
      </button>
    )
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(false)} title="Close">
        <Icon name="close" size={24}/>
      </button>
      <div className="chat-panel">
        <div className="chat-header">
          <div>
            <div className="chat-header-title">AI Procurement Analyst</div>
            <div className="chat-header-sub">Powered by Vertex AI · Gemini</div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)}>
            <Icon name="close" size={18}/>
          </button>
        </div>

        <div className="chat-messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
              {msg.text.split('\n').map((line, j) => (
                <span key={j}>
                  {line.split('**').map((part, k) =>
                    k % 2 === 1 ? <b key={k}>{part}</b> : part
                  )}
                  {j < msg.text.split('\n').length - 1 && <br/>}
                </span>
              ))}
            </div>
          ))}
          {loading && (
            <div className="chat-typing">
              <span/><span/><span/>
            </div>
          )}
        </div>

        {messages.length <= 1 && !loading && (
          <div className="chat-starters">
            {STARTERS.map((q, i) => (
              <button key={i} className="chat-starter" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about procurement data..."
            disabled={loading}
          />
          <button className="chat-send" onClick={() => send(input)} disabled={loading || !input.trim()}>
            <Icon name="send" size={14}/>
          </button>
        </div>
      </div>
    </>
  )
}
