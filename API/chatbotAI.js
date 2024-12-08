// File: routes/chats.js
import express from "express";
import authentication from "../auth/authApp.js";
import Chat from "../database/schemaChatbotAI.js";

const chats = express.Router();

chats.post("/api/chats", authentication.verifyAccessToken, async (req, res) => {
  try {
    const { userId, conversationId, role, message } = req.body;

    // Kiểm tra nếu thiếu `conversationId`, `role`, hoặc `message`
    if (!conversationId || !role || !message) {
      return res.status(400).json({
        status: "Error",
        message: "Vui lòng cung cấp đầy đủ conversationId, role và message.",
      });
    }

    // Tìm hoặc tạo Chat theo userId
    let chat = await Chat.findOne({ userId });

    if (!chat) {
      // Tạo Chat mới nếu không tồn tại
      chat = new Chat({
        userId,
        conversation: [
          {
            conversationId,
            messages: [{ role, message }],
          },
        ],
      });
    } else {
      // Tìm hoặc tạo conversation theo conversationId
      let conversation = chat.conversation.find(
        (convo) => convo.conversationId === conversationId
      );

      if (!conversation) {
        // Tạo conversation mới nếu chưa tồn tại
        conversation = { conversationId, messages: [{ role, message }] };
        chat.conversation.push(conversation);
      } else {
        // Thêm message vào conversation đã tồn tại
        conversation.messages.push({ role, message });
      }
    }

    // Lưu lại chat
    await chat.save();

    return res.status(201).json({
      status: "Success",
      message: "Tin nhắn đã được lưu thành công.",
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// xóa cuộc trò chuyện theo conversationId
chats.delete(
  "/api/chats/:userId/conversations/:conversationId",
  authentication.verifyAccessToken,
  async (req, res) => {
    try {
      const { userId, conversationId } = req.params;

      // Tìm tài liệu Chat theo userId
      const chat = await Chat.findOne({ userId });

      // Kiểm tra nếu không tìm thấy
      if (!chat) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy cuộc trò chuyện của người dùng.",
        });
      }

      // Tìm chỉ số của cuộc trò chuyện cần xóa
      const conversationIndex = chat.conversation.findIndex(
        (convo) => convo.conversationId === conversationId
      );

      // Kiểm tra nếu không tìm thấy conversationId
      if (conversationIndex === -1) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy cuộc trò chuyện với conversationId này.",
        });
      }

      // Xóa cuộc trò chuyện khỏi mảng conversation
      chat.conversation.splice(conversationIndex, 1);

      // Lưu tài liệu sau khi xóa
      await chat.save();

      return res.status(200).json({
        status: "Success",
        message: "Đã xóa cuộc trò chuyện thành công.",
      });
    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

// Lấy cuộc trò chuyện theo userId
chats.get(
  "/api/chats/:userId",
  authentication.verifyAccessToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Tìm tất cả cuộc trò chuyện theo userId
      const chat = await Chat.findOne({ userId: userId });
      // Kiểm tra nếu không tìm thấy
      if (!chat) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy cuộc trò chuyện nào.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Lấy cuộc trò chuyện thành công.",
        data: chat,
      });
    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);
export default chats;
