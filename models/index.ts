import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

// User Interface
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  bio?: string;
  displayName?: string;
  phoneNumber?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      sound: boolean;
    };
    privacy: {
      showStatus: boolean;
      showLastSeen: boolean;
      allowDirectMessages: boolean;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const userSchema = new Schema<IUser>({
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
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  displayName: {
    type: String,
    maxlength: 100,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showStatus: {
        type: Boolean,
        default: true
      },
      showLastSeen: {
        type: Boolean,
        default: true
      },
      allowDirectMessages: {
        type: Boolean,
        default: true
      }
    }
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
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Chat Interface
export interface IChat extends Document {
  name?: string;
  type: 'direct' | 'group';
  participants: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    sender: mongoose.Types.ObjectId;
    timestamp: Date;
    type: 'text' | 'file' | 'voice' | 'image';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Chat Schema
const chatSchema = new Schema<IChat>({
  name: {
    type: String,
    required: function(this: IChat) {
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    content: String,
    sender: {
      type: Schema.Types.ObjectId,
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

// Message Interface
export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'file' | 'voice' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  decryptContent(): string;
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const messageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function(this: any) {
      // Content is required for text messages, optional for file/voice/image
      return this.type === 'text';
    },
    default: ''
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
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  readBy: [{
    type: Schema.Types.ObjectId,
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
messageSchema.methods.decryptContent = function(): string {
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

// Export models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
