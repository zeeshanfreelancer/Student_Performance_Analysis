import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

const assertChatParticipant = async (userId, chatId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError('Chat not found', 404);
  const isMember = chat.participants.some((p) => p.toString() === userId.toString());
  if (!isMember) throw new AppError('You do not have access to this chat', 403);
  return chat;
};

export const getChatContacts = catchAsync(async (req, res) => {
  const me = req.user._id;
  const contactIds = new Set();

  if (req.user.role === 'admin') {
    const contacts = await User.find({ _id: { $ne: me }, status: 'active' })
      .select('name email role profileImage')
      .sort('name');
    return res.json({ success: true, data: { contacts } });
  }

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: me });
    const classIds = teacher?.classes || [];
    const students = await Student.find({ class: { $in: classIds } }).select('user parentId');
    students.forEach((s) => contactIds.add(s.user.toString()));
    const parentIds = students.map((s) => s.parentId).filter(Boolean);
    if (parentIds.length) {
      const parents = await Parent.find({ _id: { $in: parentIds } }).select('user');
      parents.forEach((p) => contactIds.add(p.user.toString()));
    }
  }

  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: me });
    if (student) {
      const teachers = await Teacher.find({ classes: student.class }).select('user');
      teachers.forEach((t) => contactIds.add(t.user.toString()));
      if (student.parentId) {
        const parent = await Parent.findById(student.parentId).select('user');
        if (parent) contactIds.add(parent.user.toString());
      }
    }
  }

  if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: me }).populate({
      path: 'children',
      select: 'user class',
    });
    const classIds = [];
    for (const child of parent?.children || []) {
      if (child?.user) contactIds.add(child.user.toString());
      if (child?.class) classIds.push(child.class);
    }
    if (classIds.length) {
      const teachers = await Teacher.find({ classes: { $in: classIds } }).select('user');
      teachers.forEach((t) => contactIds.add(t.user.toString()));
    }
  }

  const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');
  admins.forEach((a) => contactIds.add(a._id.toString()));
  contactIds.delete(me.toString());

  const contacts = await User.find({
    _id: { $in: [...contactIds] },
    status: 'active',
  })
    .select('name email role profileImage')
    .sort('name');

  res.json({ success: true, data: { contacts } });
});

export const getOrCreateChat = catchAsync(async (req, res) => {
  const { participantId } = req.body;
  if (!participantId) throw new AppError('Participant is required', 400);
  if (participantId.toString() === req.user._id.toString()) {
    throw new AppError('Cannot chat with yourself', 400);
  }

  const participant = await User.findById(participantId);
  if (!participant || participant.status !== 'active') {
    throw new AppError('User not found', 404);
  }

  let chat = await Chat.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  })
    .populate('participants', 'name email role profileImage')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name profileImage' },
    });

  if (!chat) {
    chat = await Chat.create({
      participants: [req.user._id, participantId],
      unreadCount: {},
    });
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name email role profileImage')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name profileImage' },
      });
  }

  res.json({ success: true, data: { chat } });
});

export const getMyChats = catchAsync(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate('participants', 'name email role profileImage')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name profileImage' },
    })
    .sort('-updatedAt');

  const normalized = chats.map((c) => {
    const doc = c.toObject();
    if (doc.unreadCount instanceof Map) {
      doc.unreadCount = Object.fromEntries(doc.unreadCount);
    }
    return doc;
  });

  res.json({ success: true, data: { chats: normalized } });
});

export const getMessages = catchAsync(async (req, res) => {
  await assertChatParticipant(req.user._id, req.params.chatId);

  const messages = await Message.find({ chat: req.params.chatId })
    .populate('sender', 'name profileImage')
    .sort('createdAt');

  const chat = await Chat.findById(req.params.chatId);
  if (chat?.unreadCount) {
    chat.unreadCount.set(req.user._id.toString(), 0);
    chat.markModified('unreadCount');
    await chat.save();
  }

  await Message.updateMany(
    { chat: req.params.chatId, sender: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id }, status: 'seen' }
  );

  res.json({ success: true, data: { messages } });
});

export const sendMessage = catchAsync(async (req, res) => {
  const chatId = req.params.chatId;
  const { content } = req.body;
  const chat = await assertChatParticipant(req.user._id, chatId);

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
    status: 'delivered',
  });

  chat.lastMessage = message._id;
  const other = chat.participants.find((p) => p.toString() !== req.user._id.toString());
  if (other) {
    const key = other.toString();
    const current = chat.unreadCount?.get(key) || 0;
    chat.unreadCount.set(key, current + 1);
    chat.markModified('unreadCount');
  }
  await chat.save();

  const populated = await message.populate('sender', 'name profileImage');
  res.status(201).json({ success: true, data: { message: populated } });
});
