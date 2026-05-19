import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

export const getOrCreateChat = catchAsync(async (req, res) => {
  const { participantId } = req.body;
  let chat = await Chat.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  }).populate('participants', 'name email role profileImage');

  if (!chat) {
    chat = await Chat.create({ participants: [req.user._id, participantId] });
    chat = await chat.populate('participants', 'name email role profileImage');
  }

  res.json({ success: true, data: { chat } });
});

export const getMyChats = catchAsync(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate('participants', 'name email role profileImage')
    .populate('lastMessage')
    .sort('-updatedAt');

  res.json({ success: true, data: { chats } });
});

export const getMessages = catchAsync(async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate('sender', 'name profileImage')
    .sort('createdAt');

  await Message.updateMany(
    { chat: req.params.chatId, sender: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id }, status: 'seen' }
  );

  res.json({ success: true, data: { messages } });
});

export const sendMessage = catchAsync(async (req, res) => {
  const { chatId, content } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError('Chat not found', 404);

  let image;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'chat');
    image = { url: result.secure_url, publicId: result.public_id };
  }

  const message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    content: content || '',
    image,
    status: 'sent',
  });

  chat.lastMessage = message._id;
  const other = chat.participants.find((p) => p.toString() !== req.user._id.toString());
  if (other) {
    const current = chat.unreadCount?.get(other.toString()) || 0;
    chat.unreadCount.set(other.toString(), current + 1);
  }
  await chat.save();

  const populated = await message.populate('sender', 'name profileImage');
  res.status(201).json({ success: true, data: { message: populated } });
});
