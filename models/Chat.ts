import mongoose, { Document, Schema } from 'mongoose';

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

const chatSchema = new Schema<IChat>({
  name: {
    type: String,
    required: function() {
      return this.type === 'group';
    },
    trim: true,
    maxlength: 50,
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true,
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastMessage: {
    content: String,
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['text', 'file', 'voice', 'image'],
      default: 'text',
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1 });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema); 