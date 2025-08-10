import { Document, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  username: string
  email: string
  password: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  lastSeen: Date
  comparePassword(candidatePassword: string): Promise<boolean>
  createdAt: Date
  updatedAt: Date
}

export interface IChat extends Document {
  _id: Types.ObjectId
  name?: string
  type: 'direct' | 'group'
  participants: Types.ObjectId[] | IUser[]
  admins: Types.ObjectId[] | IUser[]
  lastMessage?: {
    content: string
    sender: Types.ObjectId | IUser
    timestamp: Date
    type: 'text' | 'file' | 'voice' | 'image'
  }
  createdAt: Date
  updatedAt: Date
}

export interface IMessage extends Document {
  _id: Types.ObjectId
  chatId: Types.ObjectId | IChat
  sender: Types.ObjectId | IUser
  content: string
  type: 'text' | 'file' | 'voice' | 'image'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  replyTo?: Types.ObjectId | IMessage
  readBy: Types.ObjectId[] | IUser[]
  decryptContent(): string
  createdAt: Date
  updatedAt: Date
}

// Mongoose model types
export interface UserModel {
  findOne(filter: any): Promise<IUser | null>
  findById(id: string | Types.ObjectId): Promise<IUser | null>
  find(filter: any): Promise<IUser[]>
  create(data: any): Promise<IUser>
  findByIdAndUpdate(id: string | Types.ObjectId, update: any, options?: any): Promise<IUser | null>
}

export interface ChatModel {
  findOne(filter: any): Promise<IChat | null>
  findById(id: string | Types.ObjectId): Promise<IChat | null>
  find(filter: any): Promise<IChat[]>
  create(data: any): Promise<IChat>
  findByIdAndUpdate(id: string | Types.ObjectId, update: any, options?: any): Promise<IChat | null>
  findByIdAndDelete(id: string | Types.ObjectId): Promise<IChat | null>
}

export interface MessageModel {
  findOne(filter: any): Promise<IMessage | null>
  findById(id: string | Types.ObjectId): Promise<IMessage | null>
  find(filter: any): Promise<IMessage[]>
  create(data: any): Promise<IMessage>
  updateMany(filter: any, update: any): Promise<any>
  deleteMany(filter: any): Promise<any>
}
