import express from "express";
import authentication from "../auth/authApp.js";
import jwt from "jsonwebtoken";

const refreshToken = express.Router();

refreshToken.post("/api/refreshToken", async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) res.status(401).json("you are not authenticated");
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) res.json("error refresh token");
    const newAccessToken = authentication.createAccessToken(
      user._id,
      user.role,
      "30s"
    );
    const newRefreshToken = authentication.createRefreshToken(
      user._id,
      user.role,
      "30d"
    );
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.status(200).json({ accessToken: newAccessToken });
  });
});

export default refreshToken;
