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

    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('chat:typing', {
        userId,
        name: socket.user.name,
        isTyping,
      });
    });

    socket.on('chat:message', async ({ chatId, content, image }) => {
      try {
        const message = await Message.create({
          chat: chatId,
          sender: socket.user._id,
          content: content || '',
          image,
          status: 'delivered',
        });

        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.lastMessage = message._id;
          const other = chat.participants.find((p) => p.toString() !== userId);
          if (other) {
            const count = chat.unreadCount?.get(other.toString()) || 0;
            chat.unreadCount.set(other.toString(), count + 1);
          }
          await chat.save();
          io.to(`user:${other}`).emit('chat:notification', {
            chatId,
            message: await message.populate('sender', 'name profileImage'),
          });
        }

        const populated = await message.populate('sender', 'name profileImage');
        io.to(`chat:${chatId}`).emit('chat:message', populated);
      } catch (err) {
        socket.emit('chat:error', { message: err.message });
      }
    });

    socket.on('chat:seen', async ({ chatId }) => {
      await Message.updateMany(
        { chat: chatId, sender: { $ne: socket.user._id } },
        { $addToSet: { readBy: socket.user._id }, status: 'seen' }
      );
      socket.to(`chat:${chatId}`).emit('chat:seen', { userId, chatId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:online', { userId, online: false });
    });
  });

  return io;
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
