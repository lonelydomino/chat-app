const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import database functions
const { User, Chat, Message } = require('../models/index.js');

async function updateUserStatus(userId, status) {
  try {
    // Store user status directly in MongoDB (no expiration, persistent storage)
    await User.findByIdAndUpdate(userId, {
      status,
      lastSeen: new Date()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

function initializeSocket(server) {
  // Allow multiple origins for development and production
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://0.0.0.0:3000",
    "http://127.0.0.1:3000",
    "https://chat-app-qu48.onrender.com"
  ];

  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Normalize origins for comparison (remove protocol and trailing slash)
        const normalizeOrigin = (url) => {
          if (!url) return '';
          return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
        };
        
        const normalizedOrigin = normalizeOrigin(origin);
        
        // Check if origin is in allowed list
        const isAllowed = allowedOrigins.some(allowed => {
          const normalizedAllowed = normalizeOrigin(allowed);
          return normalizedOrigin === normalizedAllowed || normalizedOrigin.includes(normalizedAllowed);
        });
        
        if (isAllowed) {
          callback(null, true);
        } else {
          // In development, be more permissive
          if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️ Allowing origin in development:', origin);
            callback(null, true);
          } else {
            console.error('❌ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error('❌ Socket authentication failed: No token provided');
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.error('❌ Socket authentication failed: User not found', decoded.userId);
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      socket.username = user.username;
      console.log('✅ Socket authenticated:', user.username, decoded.userId);
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Update user status to online
    await updateUserStatus(socket.userId, 'online');

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join user to all their chat rooms
    const userChats = await Chat.find({ participants: socket.userId });
    userChats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });

    // Handle joining a specific chat
    socket.on('join-chat', async (chatId) => {
      const chat = await Chat.findOne({ _id: chatId, participants: socket.userId });
      if (chat) {
        socket.join(`chat:${chatId}`);
        socket.emit('chat-joined', chatId);
      }
    });

    // Handle leaving a chat
    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      socket.emit('chat-left', chatId);
    });

    // Handle typing indicators
    socket.on('typing', async (data) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: data.isTyping,
        chatId: data.chatId
      });
    });

    // Handle new messages
    socket.on('send-message', async (messageData) => {
      try {
        const message = new Message({
          chatId: messageData.chatId,
          sender: socket.userId,
          content: messageData.content,
          type: messageData.type,
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          fileSize: messageData.fileSize,
          duration: messageData.duration,
          replyTo: messageData.replyTo,
          readBy: [socket.userId]
        });

        await message.save();

        // Update chat's last message
        await Chat.findByIdAndUpdate(messageData.chatId, {
          lastMessage: {
            content: messageData.content,
            sender: socket.userId,
            timestamp: new Date(),
            type: messageData.type
          }
        });

        // Emit message to all users in the chat
        const chat = await Chat.findById(messageData.chatId).populate('participants', 'username avatar');
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('replyTo');

        // Decrypt the message content before sending
        const decryptedMessage = {
          ...populatedMessage.toObject(),
          content: populatedMessage.decryptContent()
        };

        io.to(`chat:${messageData.chatId}`).emit('new-message', {
          message: decryptedMessage,
          chat: chat
        });

        // Send notification to offline users
        const offlineUsers = chat?.participants.filter(p => p._id.toString() !== socket.userId) || [];
        offlineUsers.forEach(user => {
          io.to(`user:${user._id}`).emit('message-notification', {
            chatId: messageData.chatId,
            sender: socket.username,
            content: messageData.content.substring(0, 50)
          });
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Handle message read receipts
    socket.on('mark-read', async (data) => {
      try {
        await Message.updateMany(
          { _id: { $in: data.messageIds }, chatId: data.chatId },
          { $addToSet: { readBy: socket.userId } }
        );

        socket.to(`chat:${data.chatId}`).emit('messages-read', {
          userId: socket.userId,
          messageIds: data.messageIds
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle user presence
    socket.on('set-status', async (status) => {
      await updateUserStatus(socket.userId, status);
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        status,
        username: socket.username
      });
    });

    // Handle chat deletion
    socket.on('chat-deleted', async (data) => {
      try {
        const { chatId } = data;
        
        // Verify the chat exists and user has permission
        const chat = await Chat.findOne({ _id: chatId, participants: socket.userId });
        if (!chat) {
          return;
        }
        
        // Broadcast to all participants in the chat
        socket.to(`chat:${chatId}`).emit('chat-deleted', { chatId });
        
        // Remove all users from the chat room
        const socketsInRoom = await io.in(`chat:${chatId}`).fetchSockets();
        socketsInRoom.forEach(s => {
          s.leave(`chat:${chatId}`);
        });
        
      } catch (error) {
        console.error('Error handling chat deletion:', error);
      }
    });

    // Handle video call signaling
    socket.on('video-call-request', (data) => {
      io.to(`user:${data.targetUserId}`).emit('video-call-incoming', {
        from: socket.userId,
        fromUsername: socket.username,
        chatId: data.chatId
      });
    });

    socket.on('video-call-answer', (data) => {
      io.to(`user:${data.targetUserId}`).emit('video-call-answered', {
        from: socket.userId,
        answer: data.answer
      });
    });

    socket.on('video-call-signal', (data) => {
      io.to(`user:${data.targetUserId}`).emit('video-call-signal', {
        from: socket.userId,
        signal: data.signal
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);
      
      // Update user status to offline
      await updateUserStatus(socket.userId, 'offline');
      
      // Notify other users
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        status: 'offline',
        username: socket.username
      });
    });
  });

  return io;
}

module.exports = { initializeSocket }; 