import express from "express";
import bcrypt from "bcrypt";
import User from "../database/schemaUser.js";
import authentication from "../auth/authApp.js";

const apiLoginAccount = express.Router();

apiLoginAccount.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ status: "Error", message: "Email không tồn tại" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "Error", message: "Password incorrect" });
    }
    const accessToken = authentication.createAccessToken(
      user._id,
      user.role,
      "365d"
    );
    const refreshToken = authentication.createRefreshToken(
      user._id,
      user.role,
      "30d"
    );
    res.cookie("accessToken", accessToken);
    const { password: userPassword, ...dataUser } = user.toObject();
    return res.status(200).json({
      status: "Success",
      message: "Login success",
      data: { dataUser, accessToken, refreshToken },
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

export default apiLoginAccount;
