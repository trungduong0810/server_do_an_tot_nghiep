import express from "express";
import bcrypt from "bcrypt";
import User from "../database/schemaUser.js";
import authentication from "../auth/authApp.js";

const apiUser = express.Router();
// get all user
apiUser.get(
  "/api/users",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const users = await User.find();
      res.json({ status: "Success", data: users });
    } catch (error) {
      res
        .status(500)
        .json({ status: "Error", message: "Internal Server Error" });
    }
  }
);

// get user by id and verify token
apiUser.get(
  "/api/users/me",
  authentication.verifyAccessToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res
          .status(404)
          .json({ status: "Error", message: "User not found" });
      }
      res.json({ status: "Success", data: user });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "Error", message: "Internal Server Error" });
    }
  }
);

// get user by id --> review
apiUser.get("/api/users/review/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "Error", message: "User not found" });
    }
    res.json({ status: "Success", data: {
        username: user.username,
        avatar: user.avatar,
      }, });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// create user
apiUser.post("/api/users", async (req, res) => {
  try {
    const { username, email, password, role, avatar } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ status: "Error", message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: "Error", message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "customer",
      avatar: avatar || "",
    });
    await newUser.save();
    res.status(200).json({ status: "Success", data: newUser });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// update user
apiUser.put(
  "/api/users/:id",
  authentication.verifyAccessToken,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedData = req.body;
      if (updatedData.password) {
        updatedData.password = await bcrypt.hash(updatedData.password, 10);
      }
      const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
        new: true,
        runValidators: true,
      });
      if (!updatedUser) {
        return res
          .status(404)
          .json({ status: "Error", message: "Tài khoản không tồn tại" });
      }
      res.json({
        status: "Success",
        message: "Cập nhật thông tin tài khoản thành công",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống" });
    }
  }
);
// admin authorized customer
apiUser.put(
  "/api/admin/users/:id",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const adminId = req.user.userId;
      const userId = req.params.id;
      const { role } = req.body;

      if (userId === adminId) {
        return res.status(403).json({
          status: "Error",
          message: "Quản trị viên không thể thay đổi quyền của mình",
        });
      }

      const userToUpdate = await User.findById(userId);
      if (!userToUpdate) {
        return res
          .status(404)
          .json({ status: "Error", message: "Tài khoản không tồn tại" });
      }

      if (userToUpdate.role === "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Không thể thay đổi quyền tài khoản quản trị viên khác",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role },
        {
          new: true,
          runValidators: true,
        }
      );

      res.json({
        status: "Success",
        message: "Phân quyền tài khoản thành công",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống" });
    }
  }
);

// delete user by id -- admin
apiUser.delete(
  "/api/users/:id",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const adminId = req.user.userId;
      const userId = req.params.id;
      if (userId === adminId) {
        return res.status(403).json({
          status: "Error",
          message: "Quản trị viên không thể xóa tài khoản của mình",
        });
      }
      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
        return res
          .status(404)
          .json({ status: "Error", message: "Tài khoản không tồn tại" });
      }
      if (userToDelete.role === "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Không có quyền xóa tài khoản quản trị viên khác",
        });
      }
      await User.findByIdAndDelete(userId);
      res.json({ status: "Success", message: "Xóa tài khoản thành công" });
    } catch (error) {
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống" });
    }
  }
);

export default apiUser;
