import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId, online: true });

    socket.join(`user:${userId}`);

    socket.on('chat:join', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;
        const isMember = chat.participants.some((p) => p.toString() === userId);
        if (!isMember) return;
        socket.join(`chat:${chatId}`);
      } catch {
        // ignore invalid join
      }
    });

    socket.on('chat:typing', ({ chatId, isTyping }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('chat:typing', {
        userId,
        name: socket.user.name,
        isTyping,
      });
    });

    socket.on('chat:message', async ({ chatId, content, image }) => {
      try {
        if (!chatId || (!content?.trim() && !image)) return;

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('chat:error', { message: 'Chat not found' });
          return;
        }
        const isMember = chat.participants.some((p) => p.toString() === userId);
        if (!isMember) {
          socket.emit('chat:error', { message: 'Not authorized' });
          return;
        }

        const message = await Message.create({
          chat: chatId,
          sender: socket.user._id,
          content: (content || '').trim(),
          image,
          status: 'delivered',
        });

        chat.lastMessage = message._id;
        const other = chat.participants.find((p) => p.toString() !== userId);
        if (other) {
          const key = other.toString();
          const count = chat.unreadCount?.get(key) || 0;
          chat.unreadCount.set(key, count + 1);
          chat.markModified('unreadCount');
        }
        await chat.save();

        const populated = await message.populate('sender', 'name profileImage');
        const payload = populated.toObject ? populated.toObject() : populated;

        io.to(`chat:${chatId}`).emit('chat:message', payload);

        if (other) {
          io.to(`user:${other.toString()}`).emit('chat:notification', {
            chatId,
            message: payload,
          });
        }
      } catch (err) {
        socket.emit('chat:error', { message: err.message || 'Failed to send message' });
      }
    });

    socket.on('chat:seen', async ({ chatId }) => {
      if (!chatId) return;
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;
        const isMember = chat.participants.some((p) => p.toString() === userId);
        if (!isMember) return;

        await Message.updateMany(
          { chat: chatId, sender: { $ne: socket.user._id } },
          { $addToSet: { readBy: socket.user._id }, status: 'seen' }
        );

        if (chat.unreadCount) {
          chat.unreadCount.set(userId, 0);
          chat.markModified('unreadCount');
          await chat.save();
        }

        socket.to(`chat:${chatId}`).emit('chat:seen', { userId, chatId });
      } catch {
        // ignore
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:online', { userId, online: false });
    });
  });

  return io;
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
