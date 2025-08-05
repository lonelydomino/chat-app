const mongoose = require('mongoose');

// Check if models are already compiled
let models = {};

// User Model
if (!mongoose.models.User) {
  const bcrypt = require('bcryptjs');
  
  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    avatar: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline'
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true
  });

  // Hash password before saving
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Compare password method
  userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  models.User = mongoose.model('User', userSchema);
} else {
  models.User = mongoose.models.User;
}

// Chat Model
if (!mongoose.models.Chat) {
  const chatSchema = new mongoose.Schema({
    name: {
      type: String,
      required: function() {
        return this.type === 'group';
      },
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['text', 'file', 'voice', 'image'],
        default: 'text'
      }
    }
  }, {
    timestamps: true
  });

  // Indexes for better query performance
  chatSchema.index({ participants: 1 });
  chatSchema.index({ type: 1 });
  chatSchema.index({ 'lastMessage.timestamp': -1 });

  models.Chat = mongoose.model('Chat', chatSchema);
} else {
  models.Chat = mongoose.models.Chat;
}

// Message Model
if (!mongoose.models.Message) {
  const CryptoJS = require('crypto-js');

  const messageSchema = new mongoose.Schema({
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'file', 'voice', 'image'],
      default: 'text'
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    duration: Number, // For voice messages
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }, {
    timestamps: true
  });

  // Encrypt content before saving
  messageSchema.pre('save', function(next) {
    if (this.isModified('content') && this.content) {
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key';
      this.content = CryptoJS.AES.encrypt(this.content, encryptionKey).toString();
    }
    next();
  });

  // Decrypt content method
  messageSchema.methods.decryptContent = function() {
    if (!this.content) return '';
    
    try {
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key';
      const bytes = CryptoJS.AES.decrypt(this.content, encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting message:', error);
      return this.content; // Return encrypted content if decryption fails
    }
  };

  // Indexes for better query performance
  messageSchema.index({ chatId: 1, createdAt: -1 });
  messageSchema.index({ sender: 1 });
  messageSchema.index({ 'readBy': 1 });

  models.Message = mongoose.model('Message', messageSchema);
} else {
  models.Message = mongoose.models.Message;
}

module.exports = models; 