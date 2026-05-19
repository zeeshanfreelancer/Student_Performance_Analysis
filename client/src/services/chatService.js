import api from './api';

export const chatService = {
  getChats: () => api.get('/chat'),
  getContacts: () => api.get('/chat/contacts'),
  createChat: (participantId) => api.post('/chat', { participantId }),
  getMessages: (chatId) => api.get(`/chat/${chatId}/messages`),
  sendMessage: (chatId, data) =>
    api.post(`/chat/${chatId}/messages`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
};
