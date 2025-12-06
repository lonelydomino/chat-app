# Real-time Chat Application

A modern, full-featured real-time chat application built with Next.js, Socket.io, and MongoDB. This application demonstrates advanced real-time programming concepts and provides a complete chat experience with group chats, file sharing, voice messages, and video calls.

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant message delivery with Socket.io
- **Group Chats**: Create and manage group conversations
- **Direct Messages**: One-on-one private conversations
- **User Authentication**: Secure login/registration with JWT
- **User Presence**: Real-time online/offline status
- **Typing Indicators**: See when others are typing
- **Message Encryption**: End-to-end message encryption
- **Read Receipts**: Track message read status

### Media & File Sharing
- **File Upload**: Share documents, images, and other files
- **Voice Messages**: Record and send audio messages
- **Image Sharing**: Direct image upload and display
- **File Preview**: Preview shared files before download

### Communication Features
- **Video Calls**: Peer-to-peer video calling with WebRTC
- **Voice Calls**: Audio-only calling functionality
- **Call Management**: Accept, decline, and end calls
- **Call Notifications**: Real-time call alerts

### User Experience
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Updates**: Live chat updates and notifications
- **Search Functionality**: Find chats and messages quickly
- **Mobile Responsive**: Works perfectly on all devices
- **Dark/Light Mode**: Toggle between themes
- **Smooth Animations**: Framer Motion animations

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **Socket.io Client**: Real-time communication
- **React Hot Toast**: Toast notifications

### Backend
- **Node.js**: JavaScript runtime
- **Socket.io**: Real-time bidirectional communication
- **MongoDB**: NoSQL database with Mongoose ODM (persistent storage, no data expiration)
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **crypto-js**: Message encryption

### Real-time Features
- **WebRTC**: Peer-to-peer video/audio calls
- **MediaRecorder API**: Voice message recording
- **File API**: File upload and sharing
- **WebSocket**: Real-time data transmission

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/chat-app

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # File Upload
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads

   # Server
   NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

   # Encryption
   ENCRYPTION_KEY=your-32-character-encryption-key-here
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB (make sure it's running)
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
chat-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── AuthForm.tsx      # Authentication form
│   ├── ChatArea.tsx      # Main chat interface
│   ├── ChatHeader.tsx    # Chat header
│   ├── MessageBubble.tsx # Individual message
│   ├── MessageInput.tsx  # Message input
│   ├── MessageList.tsx   # Message list
│   ├── NewChatModal.tsx  # New chat modal
│   ├── Sidebar.tsx       # Chat sidebar
│   ├── TypingIndicator.tsx # Typing indicator
│   └── VideoCallModal.tsx # Video call modal
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication context
│   └── SocketContext.tsx # Socket.io context
├── lib/                  # Utility libraries
│   └── database.ts       # Database connections
├── models/               # MongoDB models
│   ├── Chat.ts          # Chat model
│   ├── Message.ts       # Message model
│   └── User.ts          # User model
├── server/               # Server-side code
│   └── socket.ts        # Socket.io server
├── server.js            # Main server file
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
└── README.md           # This file
```

## 🔧 Configuration

### Database Setup

1. **MongoDB**: Make sure MongoDB is running on your system
2. **Environment Variables**: Configure all required environment variables

### File Upload

The application supports file uploads with the following features:
- Maximum file size: 10MB (configurable)
- Supported formats: Images, videos, audio, documents
- Secure file storage with encryption

### Video Calls

Video calls use WebRTC for peer-to-peer communication:
- STUN servers for NAT traversal
- Automatic fallback for connection issues
- Support for both video and audio calls

## 🚀 Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

### Environment Variables for Production

Make sure to update your environment variables for production:

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
ENCRYPTION_KEY=your-production-encryption-key
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Message Encryption**: AES encryption for message content
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured CORS for security
- **Rate Limiting**: Protection against abuse

## 🧪 Testing

To run tests (when implemented):

```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Ensure MongoDB is running
3. Verify all environment variables are set correctly
4. Check the browser console for client-side errors

## 🎯 Future Enhancements

- [ ] Message reactions and emojis
- [ ] Message editing and deletion
- [ ] Advanced search functionality
- [ ] Message threading and replies
- [ ] Push notifications
- [ ] Message translation
- [ ] Screen sharing in video calls
- [ ] Group call functionality
- [ ] Message scheduling
- [ ] Chat backup and export

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Socket.io for real-time communication
- Tailwind CSS for the beautiful styling
- Framer Motion for smooth animations
- MongoDB for persistent data storage

---

**Happy Chatting! 🚀** 