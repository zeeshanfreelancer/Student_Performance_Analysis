import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FiSend, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { chatService } from '../../services/chatService';
import { connectSocket, getSocket } from '../../services/socketService';
import { getInitials, formatDateTime } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

const getOtherParticipant = (chat, userId) =>
  chat?.participants?.find((p) => !sameId(p._id, userId));

export default function ChatPage() {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id;

  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEnd = useRef(null);
  const typingTimeout = useRef(null);
  const activeChatRef = useRef(null);

  activeChatRef.current = activeChat;

  const loadChats = useCallback(async () => {
    const { data } = await chatService.getChats();
    setChats(data.data.chats || []);
  }, []);

  const loadContacts = useCallback(async () => {
    const { data } = await chatService.getContacts();
    setContacts(data.data.contacts || []);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) connectSocket(token);

    Promise.all([loadChats(), loadContacts()])
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [loadChats, loadContacts]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onError = ({ message }) => toast.error(message || 'Chat error');

    const onMessage = (msg) => {
      const chatId = String(msg.chat?._id || msg.chat);
      const current = activeChatRef.current;

      setChats((prev) => {
        const updated = prev.map((c) => {
          if (String(c._id) !== chatId) return c;
          return { ...c, lastMessage: msg, updatedAt: msg.createdAt };
        });
        const exists = updated.some((c) => String(c._id) === chatId);
        if (!exists) {
          loadChats();
          return prev;
        }
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
      });

      if (!current || String(current._id) !== chatId) return;

      setMessages((prev) => {
        const filtered = prev.filter(
          (m) =>
            !(
              m.pending &&
              sameId(m.sender?._id, msg.sender?._id) &&
              m.content === msg.content
            )
        );
        if (filtered.some((m) => m._id === msg._id)) return filtered;
        return [...filtered, msg];
      });
    };

    const onTyping = ({ name, isTyping }) => {
      setTyping(isTyping ? `${name} is typing...` : '');
    };

    const onNotification = () => {
      loadChats();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:error', onError);
    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:notification', onNotification);

    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:error', onError);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:notification', onNotification);
    };
  }, [loadChats]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectChat = async (chat) => {
    setActiveChat(chat);
    setShowContacts(false);
    setTyping('');

    const socket = getSocket();
    socket?.emit('chat:join', chat._id);

    try {
      const { data } = await chatService.getMessages(chat._id);
      setMessages(data.data.messages || []);
      socket?.emit('chat:seen', { chatId: chat._id });
    } catch {
      toast.error('Failed to load messages');
      setMessages([]);
    }
  };

  const startChat = async (contact) => {
    try {
      const { data } = await chatService.createChat(contact._id);
      const chat = data.data.chat;
      setChats((prev) => {
        const exists = prev.some((c) => sameId(c._id, chat._id));
        if (exists) return prev;
        return [chat, ...prev];
      });
      await selectChat(chat);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start chat');
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !activeChat || sending) return;

    setSending(true);
    setInput('');

    const optimistic = {
      _id: `pending-${Date.now()}`,
      chat: activeChat._id,
      content,
      sender: { _id: userId, name: user.name, profileImage: user.profileImage },
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    const socket = getSocket();

    try {
      if (socket?.connected) {
        socket.emit('chat:message', { chatId: activeChat._id, content });
      } else {
        const { data } = await chatService.sendMessage(activeChat._id, { content });
        setMessages((prev) =>
          prev
            .filter((m) => m._id !== optimistic._id)
            .concat(data.data.message)
        );
        loadChats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!activeChat) return;
    const socket = getSocket();
    socket?.emit('chat:typing', { chatId: activeChat._id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('chat:typing', { chatId: activeChat._id, isTyping: false });
    }, 1000);
  };

  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q)
    );
  });

  const activeOther = activeChat ? getOtherParticipant(activeChat, userId) : null;

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Messages</h2>
        <span
          className={`text-xs ${socketConnected ? 'text-green-600' : 'text-amber-600'}`}
          title={socketConnected ? 'Real-time connected' : 'Using backup mode — messages may be slower'}
        >
          {socketConnected ? '● Live' : '○ Offline mode'}
        </span>
      </div>

      <div className="flex h-[calc(100vh-10rem)] min-h-[420px] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        {/* Sidebar */}
        <div className="flex w-80 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between border-b p-3">
            <span className="font-semibold">Conversations</span>
            <button
              type="button"
              onClick={() => setShowContacts((v) => !v)}
              className="btn-primary !px-2 !py-1.5 text-xs"
              title="New message"
            >
              <FiPlus className="h-4 w-4" />
            </button>
          </div>

          {showContacts ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b p-2">
                <div className="relative">
                  <FiSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input-field w-full pl-8 text-sm"
                    placeholder="Search people..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowContacts(false)}
                  className="mt-2 flex items-center text-xs text-gray-500 hover:text-primary-600"
                >
                  <FiX className="mr-1" /> Back to chats
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">No contacts found</p>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact._id}
                      type="button"
                      onClick={() => startChat(contact)}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm text-white">
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{contact.name}</p>
                        <p className="truncate text-xs capitalize text-gray-500">{contact.role}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  <p>No conversations yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowContacts(true)}
                    className="btn-primary mt-3 text-xs"
                  >
                    Start a chat
                  </button>
                </div>
              ) : (
                chats.map((chat) => {
                  const other = getOtherParticipant(chat, userId);
                  const preview = chat.lastMessage?.content || 'No messages yet';
                  const unread =
                    chat.unreadCount?.[userId] ??
                    chat.unreadCount?.[String(userId)] ??
                    0;
                  return (
                    <button
                      key={chat._id}
                      type="button"
                      onClick={() => selectChat(chat)}
                      className={`flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 ${
                        sameId(activeChat?._id, chat._id)
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : ''
                      }`}
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm text-white">
                        {getInitials(other?.name)}
                        {unread > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{other?.name || 'Unknown'}</p>
                        <p className="truncate text-xs text-gray-500">{preview}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="flex flex-1 flex-col bg-white dark:bg-gray-950">
          {activeChat ? (
            <>
              <div className="border-b px-4 py-3">
                <p className="font-semibold">{activeOther?.name}</p>
                <p className="text-xs capitalize text-gray-500">{activeOther?.role}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">No messages yet. Say hello!</p>
                ) : (
                  messages.map((msg) => {
                    const isMine = sameId(msg.sender?._id, userId);
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isMine
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                          } ${msg.pending ? 'opacity-70' : ''}`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          {msg.image?.url && (
                            <img
                              src={msg.image.url}
                              alt=""
                              className="mt-2 max-h-48 max-w-full rounded-lg"
                            />
                          )}
                          <p
                            className={`mt-1 text-[10px] ${
                              isMine ? 'text-primary-100' : 'text-gray-400'
                            }`}
                          >
                            {msg.pending ? 'Sending…' : formatDateTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEnd} />
              </div>

              {typing && <p className="px-4 text-xs text-gray-500">{typing}</p>}

              <div className="flex gap-2 border-t p-4">
                <input
                  className="input-field flex-1"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="btn-primary !px-4"
                  aria-label="Send"
                >
                  <FiSend />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-gray-500">
              <p>Select a conversation or start a new chat.</p>
              <button type="button" onClick={() => setShowContacts(true)} className="btn-primary text-sm">
                <FiPlus className="mr-1 inline" /> New message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
