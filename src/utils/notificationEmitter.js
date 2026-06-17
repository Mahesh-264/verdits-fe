// 🔔 Real-time Notification Emitter
// This module handles emitting socket events for real-time notifications

import socket from './socket';

/**
 * Emit notification when a post is liked
 */
export const emitPostLiked = (postId, postCreatorId) => {
  if (socket.connected) {
    socket.emit('postLiked', { postId, postCreatorId });
  }
};

/**
 * Emit notification when a comment is added to a post
 */
export const emitPostCommented = (postId, postCreatorId, comment) => {
  if (socket.connected) {
    socket.emit('postCommented', { postId, postCreatorId, comment });
  }
};

/**
 * Emit notification when a lawyer is followed
 */
export const emitLawyerFollowed = (lawyerId) => {
  if (socket.connected) {
    socket.emit('lawyerFollowed', { lawyerId });
  }
};

/**
 * Emit notification when a connection request is sent
 */
export const emitConnectionRequested = (targetStudentId) => {
  if (socket.connected) {
    socket.emit('connectionRequested', { targetStudentId });
  }
};

/**
 * Emit notification when appointment status changes
 */
export const emitAppointmentStatusChanged = (studentId, status) => {
  if (socket.connected) {
    socket.emit('appointmentStatusChanged', { studentId, status });
  }
};

/**
 * Emit notification when message is sent
 */
export const emitMessageSent = (receiverId, content) => {
  if (socket.connected) {
    socket.emit('sendMessage', { receiverId, content });
  }
};

/**
 * Connect socket if not already connected
 */
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
