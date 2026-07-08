import { useState, useEffect, useRef } from 'react';
import { Send, Search, ArrowLeft, MessageCircle } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { SocialThread, SocialMessage } from '../../types';

function ThreadSkeleton() {
  return (
    <div className="ig-dm-chat-item" style={{ pointerEvents: 'none' }}>
      <Skeleton variant="circle" width={44} height={44} />
      <div className="ig-dm-chat-info">
        <Skeleton height={12} width="60%" />
        <Skeleton height={10} width="80%" />
      </div>
    </div>
  );
}

export function SocialMessages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<SocialThread[]>([]);
  const [activeThread, setActiveThread] = useState<SocialThread | null>(null);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showInbox, setShowInbox] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    if (activeThread) {
      loadMessages(activeThread.id);
      setShowInbox(false);
    }
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadThreads = async () => {
    try {
      const data = await api.getUserThreads();
      setThreads(data || []);
    } catch (err) {
      console.error('Error loading threads', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const data = await api.getThreadMessages(threadId);
      setMessages(data.messages || []);
      await api.markThreadAsRead(threadId);
    } catch (err) {
      console.error('Error loading messages', err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeThread) return;
    try {
      const msg = await api.sendSocialMessage({ content: newMessage, threadId: activeThread.id });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      loadThreads();
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const results = await api.searchSocialProfiles(q);
      setSearchResults(results || []);
    } catch {}
  };

  const handleStartThread = async (targetUserId: string) => {
    const existing = threads.find(t => !t.isGroup && t.members.some(m => m.userId === targetUserId));
    if (existing) { setActiveThread(existing); return; }
    try {
      const thread = await api.createSocialThread({ memberIds: [targetUserId] });
      setThreads(prev => [thread, ...prev]);
      setActiveThread(thread);
      setSearchQuery('');
      setSearchResults([]);
    } catch {}
  };

  const getThreadName = (thread: SocialThread): string => {
    if (thread.title) return thread.title;
    const others = thread.members.filter(m => m.userId !== user?.id);
    return others.map(m => m.user.socialProfile?.displayName || m.user.name).join(', ') || 'Sin nombre';
  };

  const getThreadAvatar = (thread: SocialThread): string => {
    const other = thread.members.find(m => m.userId !== user?.id);
    return other?.user.name?.[0]?.toUpperCase() || '?';
  };

  return (
    <div className="ig-dm">
      {/* Inbox panel */}
      <div className={`ig-dm-inbox ${!showInbox ? 'hidden-mobile' : ''}`}>
        <div className="ig-dm-inbox-header">
          <strong>{user?.name || 'Usuario'}</strong>
          <div className="ig-dm-search">
            <Search size={16} />
            <input placeholder="Buscar" value={searchQuery} onChange={e => handleSearchUsers(e.target.value)} />
          </div>
        </div>
        {searchResults.length > 0 && (
          <div className="ig-dm-search-results">
            {searchResults.map(p => (
              <button key={p.id} className="ig-dm-search-item" onClick={() => handleStartThread(p.userId)}>
                <div className="ig-avatar-xs">{(p.displayName || p.user?.name || '?')[0].toUpperCase()}</div>
                <span>{p.displayName || p.user?.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="ig-dm-chats">
          {loading ? (
            <><ThreadSkeleton /><ThreadSkeleton /><ThreadSkeleton /><ThreadSkeleton /></>
          ) : (
            threads.map(thread => (
              <button key={thread.id} className={`ig-dm-chat-item ${activeThread?.id === thread.id ? 'active' : ''}`} onClick={() => setActiveThread(thread)}>
                <div className="ig-dm-chat-avatar">{getThreadAvatar(thread)}</div>
                <div className="ig-dm-chat-info">
                  <strong>{getThreadName(thread)}</strong>
                  {thread.lastMessage && <span>{thread.lastMessage.content.substring(0, 40)}</span>}
                </div>
              </button>
            ))
          )}
          {!loading && threads.length === 0 && <div className="ig-dm-empty">No hay conversaciones</div>}
        </div>
      </div>

      {/* Chat window */}
      <div className={`ig-dm-window ${showInbox ? 'hidden-mobile' : ''}`}>
        {activeThread ? (
          <>
            <div className="ig-dm-window-header">
              <button className="ig-back-btn" onClick={() => { setShowInbox(true); setActiveThread(null); }}>
                <ArrowLeft size={20} />
              </button>
              <div className="ig-dm-window-user">
                <div className="ig-avatar-xs">{getThreadAvatar(activeThread)}</div>
                <strong>{getThreadName(activeThread)}</strong>
              </div>
            </div>
            <div className="ig-dm-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`ig-msg-bubble ${msg.senderId === user?.id ? 'outbound' : 'inbound'}`}>
                  <p>{msg.content}</p>
                  <span className="ig-msg-time">{formatMsgTime(msg.createdAt)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="ig-dm-input">
              <input placeholder="Mensaje..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
              <button onClick={handleSend} disabled={!newMessage.trim()}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="ig-dm-placeholder">
            <MessageCircle size={64} strokeWidth={1} />
            <h3>Mensajes Directos</h3>
            <p>Selecciona un chat o busca usuarios</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMsgTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
