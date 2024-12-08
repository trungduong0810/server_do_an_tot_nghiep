import express from "express";
import Review from "../database/schemaReview.js";
import authentication from "../auth/authApp.js";
const apiReview = express.Router();

// lấy tất cả review từ nameplate
apiReview.get("/api/review/:nameplateSlug", async (req, res) => {
  try {
    const { nameplateSlug } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ nameplateSlug })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ nameplateSlug });

    if (!reviews || reviews.length === 0) {
      return res
        .status(404)
        .json({ status: "Error", message: "Không tìm thấy bài đánh giá" });
    }

    res.json({
      status: "Success",
      data: reviews,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Error", message: "Lỗi hệ thống" });
  }
});

// API POST để thêm một bài đánh giá
apiReview.post(
  "/api/review",
  authentication.verifyAccessToken,
  async (req, res) => {
    try {
      const {
        nameplate,
        nameplateSlug,
        userId,
        star,
        evaluate,
        reviewContent,
        reviewImages,
      } = req.body;

      if (!nameplate || !nameplateSlug || !userId || !star || !evaluate) {
        return res
          .status(400)
          .json({ status: "Error", message: "Thiếu thông tin cần thiết" });
      }

      const newReview = new Review({
        nameplate,
        nameplateSlug,
        userId,
        star,
        evaluate,
        reviewContent,
        reviewImages: reviewImages || [],
      });

      await newReview.save();

      res.status(201).json({
        status: "Success",
        message: "Bài đánh giá đã được thêm thành công",
        data: newReview,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "Error", message: "Lỗi hệ thống khi thêm đánh giá" });
    }
  }
);

export default apiReview;
