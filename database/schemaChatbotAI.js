import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "bot"] },
    message: { type: String },
  },
  { _id: true } 
);

const conversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String },
    messages: [messageSchema], // Mảng tin nhắn
  },
  { _id: true } // Sử dụng ID tự động tạo cho mỗi cuộc trò chuyện
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: String },
    conversation: [conversationSchema], // Mảng cuộc trò chuyện
  },
  { timestamps: true } // Thêm timestamps tự động
);

const Chat = mongoose.model("Chats", chatSchema);

export default Chat;
