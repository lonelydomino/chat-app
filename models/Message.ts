import mongoose, { Document, Schema } from 'mongoose';
import CryptoJS from 'crypto-js';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'file' | 'voice' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number; // for voice messages
  replyTo?: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'file', 'voice', 'image'],
    default: 'text',
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  duration: Number, // for voice messages in seconds
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Encrypt content before saving
messageSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content) {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    this.content = CryptoJS.AES.encrypt(this.content, encryptionKey).toString();
  }
  next();
});

// Decrypt content when retrieving
messageSchema.methods.decryptContent = function(): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  try {
    const bytes = CryptoJS.AES.decrypt(this.content, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return this.content; // Return encrypted content if decryption fails
  }
};

// Index for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema); 