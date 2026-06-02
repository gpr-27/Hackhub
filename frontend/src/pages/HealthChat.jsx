import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircleHeart, Sparkles, Flower2, LifeBuoy, Send, Bot, Phone,
  CircleArrowDown, ShieldAlert, Plus, Pencil, Trash2, Copy, Check, RotateCcw,
  MessageSquare,
} from 'lucide-react';
import AppShell, { useAppUser } from '../components/AppShell';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, makeAuthenticatedRequest } from '../config/api';
import config from '../config';
import { sendChat } from '../lib/ai';
import { cn } from '../lib/cn';
import {
  PageHeader, Card, Button, Badge, SegmentedControl, Skeleton, EmptyState, ConfirmDialog,
} from '../components/ui';
import '../styles/HealthChat.css';

const MODES = [
  { value: 'therapy', label: 'Therapy', icon: MessageCircleHeart },
  { value: 'meditation', label: 'Meditation', icon: Flower2 },
  { value: 'wellness', label: 'Wellness', icon: Sparkles },
  { value: 'crisis', label: 'Crisis', icon: LifeBuoy },
];

const MODE_META = {
  therapy: { title: 'Therapy Chat', blurb: 'A supportive, judgment-free space to talk things through.' },
  meditation: { title: 'Mindfulness Guide', blurb: 'Gentle breathing, grounding and meditation guidance.' },
  wellness: { title: 'Wellness Coach', blurb: 'Daily motivation and small steps toward feeling better.' },
  crisis: { title: 'Crisis Support', blurb: 'Immediate, calming support when things feel like too much.' },
};

const SUGGESTIONS = [
  "I'm feeling anxious right now",
  'Help me with stress management',
  'Guide me through a breathing exercise',
  "I'm having trouble sleeping",
  'I feel overwhelmed today',
  'I could use a little motivation',
];

const FALLBACK_REPLY =
  "I'm here with you. I'm having a little trouble connecting right now, so please try again in a moment. You don't have to go through this alone.";

// Stable API helper (uses the centralized base URL + Clerk-authenticated fetch).
const api = (path, method = 'GET', body) =>
  makeAuthenticatedRequest(`${API_BASE_URL}${path}`, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

function formatTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Render inline markdown: **bold**, *italic*, `code`. Returns React nodes so the
// raw "*" / "**" markers never reach the screen.
function renderInline(text) {
  const out = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let key = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) out.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] !== undefined) out.push(<em key={key++}>{m[3]}</em>);
    else if (m[4] !== undefined) out.push(<code className="hc-code" key={key++}>{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Renders bot text as clean, styled markup: groups bullet / numbered lines into
 * lists, treats "#"-prefixed lines as headings, and renders inline bold/italic/
 * code within every line.
 */
function BotText({ text }) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let list = null; // { type: 'ul' | 'ol', items: [] }

  const flush = () => {
    if (!list) return;
    const Tag = list.type;
    blocks.push(
      <Tag className="hc-bubble-list" key={`l-${blocks.length}`}>
        {list.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      flush();
      return;
    }
    const bullet = line.match(/^[•\-*]\s+(.*)/);
    const ordered = line.match(/^\d+[.)]\s+(.*)/);
    const heading = line.match(/^#{1,6}\s+(.*)/);

    if (bullet) {
      if (!list || list.type !== 'ul') {
        flush();
        list = { type: 'ul', items: [] };
      }
      list.items.push(bullet[1]);
    } else if (ordered) {
      if (!list || list.type !== 'ol') {
        flush();
        list = { type: 'ol', items: [] };
      }
      list.items.push(ordered[1]);
    } else {
      flush();
      if (heading) {
        blocks.push(<p className="hc-bubble-h" key={`h-${i}`}>{renderInline(heading[1])}</p>);
      } else {
        blocks.push(<p className="hc-bubble-line" key={`p-${i}`}>{renderInline(line)}</p>);
      }
    }
  });
  flush();

  return <>{blocks.length ? blocks : <p className="hc-bubble-line">{renderInline(text)}</p>}</>;
}

export default function HealthChat() {
  const { user } = useAppUser();
  const { toast } = useToast();

  // Conversation state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState('therapy');
  const [model, setModel] = useState(config.llm.defaultModel);
  const [showJump, setShowJump] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Saved-chats (sessions) state
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'delete'|'clear', id? }
  const [confirmLoading, setConfirmLoading] = useState(false);

  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const firstName = (user?.name || '').trim().split(' ')[0];

  // --- Sessions: load list -------------------------------------------------
  const refreshSessions = useCallback(async () => {
    try {
      const res = await api('/api/chat/sessions', 'GET');
      if (res.ok) setSessions(await res.json());
    } catch {
      /* non-blocking */
    }
  }, []);

  const openSession = useCallback(async (id) => {
    setActiveId(id);
    setSessionsOpen(false);
    setLoading(true);
    try {
      const res = await api(`/api/chat/sessions/${id}`, 'GET');
      const data = res.ok ? await res.json() : null;
      setMessages(data?.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const newChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setInput('');
    setSessionsOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  // --- Initial load: list sessions, open the most recent -------------------
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api('/api/chat/sessions', 'GET');
        const list = res.ok ? await res.json() : [];
        if (!active) return;
        setSessions(list);
        if (list.length) {
          const id = list[0]._id;
          setActiveId(id);
          const r2 = await api(`/api/chat/sessions/${id}`, 'GET');
          const data = r2.ok ? await r2.json() : null;
          if (active) setMessages(data?.messages || []);
        } else {
          setActiveId(null);
          setMessages([]);
        }
      } catch {
        if (active) toast.error('We could not load your saved chats.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Send flow -----------------------------------------------------------
  const handleSend = useCallback(
    async (raw) => {
      const text = (raw ?? input).trim();
      if (!text || sending) return;

      setInput('');
      setSending(true);

      const userMsg = { sender: 'user', message: text, timestamp: new Date().toISOString() };
      const afterUser = [...messages, userMsg];
      setMessages(afterUser);

      // Create the saved chat lazily on the first message (title summarizes it).
      let id = activeId;
      try {
        if (!id) {
          const res = await api('/api/chat/sessions', 'POST', { title: text, messages: afterUser });
          if (res.ok) {
            id = (await res.json())._id;
            setActiveId(id);
          }
        }
      } catch {
        /* persistence is best-effort */
      }

      let next;
      try {
        const { text: botText } = await sendChat(text, mode, model);
        next = [...afterUser, { sender: 'bot', message: botText || FALLBACK_REPLY, timestamp: new Date().toISOString() }];
      } catch {
        toast.error('The wellness assistant is unavailable right now.');
        next = [...afterUser, { sender: 'bot', message: FALLBACK_REPLY, timestamp: new Date().toISOString() }];
      }
      setMessages(next);

      try {
        if (id) await api(`/api/chat/sessions/${id}`, 'PUT', { messages: next, autoTitle: true });
      } catch {
        /* best-effort */
      }
      refreshSessions();
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [input, sending, messages, activeId, mode, model, refreshSessions, toast]
  );

  // --- Regenerate the last reply ------------------------------------------
  const handleRegenerate = useCallback(async () => {
    if (sending) return;
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;

    const userText = messages[lastUserIdx].message;
    const base = messages.slice(0, lastUserIdx + 1);
    setMessages(base);
    setSending(true);

    let next;
    try {
      const { text: botText } = await sendChat(userText, mode, model);
      next = [...base, { sender: 'bot', message: botText || FALLBACK_REPLY, timestamp: new Date().toISOString() }];
    } catch {
      toast.error('Could not regenerate the response.');
      next = [...base, { sender: 'bot', message: FALLBACK_REPLY, timestamp: new Date().toISOString() }];
    }
    setMessages(next);

    try {
      if (activeId) await api(`/api/chat/sessions/${activeId}`, 'PUT', { messages: next, autoTitle: true });
    } catch {
      /* best-effort */
    }
    refreshSessions();
    setSending(false);
  }, [messages, sending, activeId, mode, model, refreshSessions, toast]);

  // --- Copy a message ------------------------------------------------------
  const copyMessage = useCallback(
    async (text, idx) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1600);
      } catch {
        toast.error('Could not copy.');
      }
    },
    [toast]
  );

  // --- Rename / delete / clear --------------------------------------------
  const startRename = (s) => {
    setEditingId(s._id);
    setEditingTitle(s.title);
  };
  const submitRename = useCallback(async () => {
    const title = editingTitle.trim();
    const id = editingId;
    setEditingId(null);
    if (!id || !title) return;
    try {
      await api(`/api/chat/sessions/${id}`, 'PUT', { title });
      refreshSessions();
    } catch {
      toast.error('Could not rename the chat.');
    }
  }, [editingId, editingTitle, refreshSessions, toast]);

  const runConfirm = useCallback(async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === 'delete') {
        await api(`/api/chat/sessions/${confirm.id}`, 'DELETE');
        const remaining = sessions.filter((s) => s._id !== confirm.id);
        setSessions(remaining);
        if (confirm.id === activeId) {
          if (remaining.length) openSession(remaining[0]._id);
          else newChat();
        }
        toast.success('Chat deleted');
      } else {
        await api('/api/chat/sessions', 'DELETE');
        setSessions([]);
        newChat();
        toast.success('All chats cleared');
      }
    } catch {
      toast.error('Could not complete that action.');
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  }, [confirm, sessions, activeId, openSession, newChat, toast]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Auto-scroll to newest ----------------------------------------------
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowJump(!nearBottom && messages.length > 4);
  };

  const jumpToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  const meta = MODE_META[mode];
  const isEmpty = !loading && messages.length === 0;
  const lastIdx = messages.length - 1;

  return (
    <AppShell title="Wellness Chat" subtitle="Always here for you">
      <PageHeader
        eyebrow="AI Companion"
        title="Wellness Chat"
        subtitle={
          firstName
            ? `Hi ${firstName}, this is your private space to talk it out — anytime.`
            : 'A private space to talk it out, supported by an empathetic AI.'
        }
        actions={<Badge tone="success" dot>Online</Badge>}
      />

      <div className="hc-page animate-in">
        <div className="hc-layout">
          {/* ---- Saved chats sidebar ---- */}
          <aside className={cn('hc-sessions', sessionsOpen && 'is-open')}>
            <div className="hc-sessions__head">
              <Button variant="primary" block onClick={newChat}>
                <Plus size={16} /> New chat
              </Button>
            </div>
            <div className="hc-sessions__list">
              {sessions.length === 0 ? (
                <p className="hc-sessions__empty">No saved chats yet. Start a conversation and it'll be saved here.</p>
              ) : (
                sessions.map((s) => (
                  <div key={s._id} className={cn('hc-session', s._id === activeId && 'is-active')}>
                    {editingId === s._id ? (
                      <input
                        className="hc-session__edit"
                        value={editingTitle}
                        autoFocus
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={submitRename}
                        aria-label="Chat title"
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="hc-session__open"
                          onClick={() => openSession(s._id)}
                          title={s.title}
                        >
                          <MessageSquare size={15} />
                          <span className="hc-session__title">{s.title}</span>
                        </button>
                        <span className="hc-session__actions">
                          <button
                            type="button"
                            className="hc-session__icon"
                            onClick={() => startRename(s)}
                            aria-label="Rename chat"
                            title="Rename"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="hc-session__icon hc-session__icon--danger"
                            onClick={() => setConfirm({ type: 'delete', id: s._id })}
                            aria-label="Delete chat"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            {sessions.length > 0 && (
              <div className="hc-sessions__foot">
                <button type="button" className="hc-sessions__clear" onClick={() => setConfirm({ type: 'clear' })}>
                  <Trash2 size={14} /> Clear all chats
                </button>
              </div>
            )}
          </aside>

          {sessionsOpen && <div className="hc-sessions__backdrop" onClick={() => setSessionsOpen(false)} />}

          {/* ---- Main column ---- */}
          <div className="hc-main">
            <div className="hc-modes">
              <button
                type="button"
                className="hc-sessions-toggle"
                onClick={() => setSessionsOpen((o) => !o)}
                aria-label="Toggle saved chats"
                title="Saved chats"
              >
                <MessageSquare size={18} />
              </button>
              <SegmentedControl value={mode} onChange={setMode} options={MODES} />
              <span className="hc-mode-blurb">{meta.blurb}</span>
              <label className="hc-model">
                <span className="hc-model__label">Model</span>
                <select
                  className="hc-model__select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={sending}
                  aria-label="AI model"
                >
                  {config.llm.availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {mode === 'crisis' && (
              <Card solid className="hc-crisis" role="alert">
                <span className="hc-crisis__icon"><ShieldAlert size={22} /></span>
                <div className="hc-crisis__body">
                  <strong>You matter, and help is available right now.</strong>
                  <p>
                    In immediate danger? Call your local emergency number. In the US, call or text{' '}
                    <a href="tel:988" className="hc-crisis__line"><Phone size={14} /> 988</a> (Suicide &amp; Crisis Lifeline).
                  </p>
                </div>
              </Card>
            )}

            <Card pad={false} className="hc-shell">
              <div className="hc-stream" ref={scrollRef} onScroll={handleScroll} aria-live="polite" aria-busy={sending}>
                {loading ? (
                  <div className="hc-skeletons" aria-hidden="true">
                    <Skeleton width="62%" height={54} radius={18} className="hc-sk hc-sk--bot" />
                    <Skeleton width="48%" height={40} radius={18} className="hc-sk hc-sk--user" />
                    <Skeleton width="70%" height={62} radius={18} className="hc-sk hc-sk--bot" />
                    <Skeleton width="40%" height={40} radius={18} className="hc-sk hc-sk--user" />
                  </div>
                ) : isEmpty ? (
                  <div className="hc-empty">
                    <EmptyState
                      icon={MessageCircleHeart}
                      title={`Welcome to ${meta.title}`}
                      text="Share whatever is on your mind. There are no wrong words here — start with a thought or pick a prompt below."
                    />
                    <div className="hc-suggestions stagger">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} type="button" className="hc-chip" onClick={() => handleSend(s)} disabled={sending}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ol className="hc-list">
                    {messages.map((msg, i) => {
                      const isUser = msg.sender === 'user';
                      const isLastBot = !isUser && i === lastIdx;
                      return (
                        <li key={`${i}-${msg.timestamp || ''}`} className={`hc-row ${isUser ? 'hc-row--user' : 'hc-row--bot'}`}>
                          {!isUser && (
                            <span className="hc-avatar" aria-hidden="true">
                              <Bot size={18} />
                            </span>
                          )}
                          <div className={`hc-bubble ${isUser ? 'hc-bubble--user' : 'hc-bubble--bot'}`}>
                            <div className="hc-bubble__text">
                              {isUser ? msg.message : <BotText text={msg.message} />}
                            </div>
                            <time className="hc-bubble__time">{formatTime(msg.timestamp)}</time>
                            {!isUser && (
                              <div className="hc-bubble__actions">
                                <button type="button" className="hc-msg-action" onClick={() => copyMessage(msg.message, i)}>
                                  {copiedIdx === i ? <Check size={13} /> : <Copy size={13} />}
                                  {copiedIdx === i ? 'Copied' : 'Copy'}
                                </button>
                                {isLastBot && !sending && (
                                  <button type="button" className="hc-msg-action" onClick={handleRegenerate}>
                                    <RotateCcw size={13} /> Regenerate
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}

                    {sending && (
                      <li className="hc-row hc-row--bot" aria-label="Assistant is typing">
                        <span className="hc-avatar" aria-hidden="true"><Bot size={18} /></span>
                        <div className="hc-bubble hc-bubble--bot hc-bubble--typing">
                          <span className="hc-typing"><i /><i /><i /></span>
                        </div>
                      </li>
                    )}
                  </ol>
                )}

                <div ref={endRef} />
              </div>

              {showJump && (
                <button type="button" className="hc-jump" onClick={jumpToBottom}>
                  <CircleArrowDown size={16} /> New messages
                </button>
              )}

              <form
                className="hc-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <label htmlFor="hc-input" className="hc-sr-only">Type your message</label>
                <textarea
                  id="hc-input"
                  ref={textareaRef}
                  className="hc-input"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Share what's on your mind… (${meta.title})`}
                  disabled={sending}
                />
                <Button
                  type="submit"
                  variant="primary"
                  iconOnly
                  className="hc-send"
                  loading={sending}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  {!sending && <Send size={18} />}
                </Button>
              </form>

              <p className="hc-foot">
                <Sparkles size={13} /> Powered by {config.llm.providerLabel} · This is supportive guidance, not a substitute for professional care.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={confirmLoading}
        danger
        title={confirm?.type === 'clear' ? 'Clear all chats?' : 'Delete this chat?'}
        message={
          confirm?.type === 'clear'
            ? 'This permanently deletes every saved chat. This cannot be undone.'
            : 'This permanently deletes this conversation. This cannot be undone.'
        }
        confirmLabel={confirm?.type === 'clear' ? 'Clear all' : 'Delete'}
      />
    </AppShell>
  );
}
