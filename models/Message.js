const mongoose = require('mongoose');
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

module.exports = mongoose.model('Message', messageSchema); 