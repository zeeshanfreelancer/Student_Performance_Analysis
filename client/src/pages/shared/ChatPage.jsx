import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FiSend, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { chatService } from '../../services/chatService';
import { getSocket } from '../../services/socketService';
import { getInitials } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ChatPage() {
  const { user } = useSelector((state) => state.auth);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEnd = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    chatService.getChats().then(({ data }) => {
      setChats(data.data.chats);
      setLoading(false);
    }).catch(() => toast.error('Failed to load chats'));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('chat:message', (msg) => {
      if (msg.chat === activeChat?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    socket.on('chat:typing', ({ name, isTyping }) => {
      setTyping(isTyping ? `${name} is typing...` : '');
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:typing');
    };
  }, [activeChat]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectChat = async (chat) => {
    setActiveChat(chat);
    const socket = getSocket();
    socket?.emit('chat:join', chat._id);
    const { data } = await chatService.getMessages(chat._id);
    setMessages(data.data.messages);
    socket?.emit('chat:seen', { chatId: chat._id });
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const socket = getSocket();
    socket?.emit('chat:message', { chatId: activeChat._id, content: input });
    setInput('');
  };

  const handleTyping = () => {
    const socket = getSocket();
    socket?.emit('chat:typing', { chatId: activeChat._id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('chat:typing', { chatId: activeChat._id, isTyping: false });
    }, 1000);
  };

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="w-80 shrink-0 border-r border-gray-200 dark:border-gray-800">
        <div className="border-b p-4 font-semibold">Messages</div>
        <div className="overflow-y-auto">
          {chats.map((chat) => {
            const other = chat.participants?.find((p) => p._id !== user._id);
            return (
              <button
                key={chat._id}
                onClick={() => selectChat(chat)}
                className={`flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 ${
                  activeChat?._id === chat._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm text-white">
                  {getInitials(other?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{other?.name}</p>
                  <p className="truncate text-xs text-gray-500 capitalize">{other?.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {activeChat ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.sender._id === user._id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    {msg.image?.url && <img src={msg.image.url} alt="" className="mt-2 max-w-full rounded" />}
                  </div>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>
            {typing && <p className="px-4 text-xs text-gray-500">{typing}</p>}
            <div className="flex gap-2 border-t p-4">
              <input
                className="input-field flex-1"
                value={input}
                onChange={(e) => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} className="btn-primary !px-4"><FiSend /></button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
