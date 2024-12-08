import express from "express";
import authentication from "../auth/authApp.js";
import News from "../database/schemaNews.js";
const news = express.Router();

// lấy dữ liệu theo category
news.get("/api/news/:categoryNews", async (req, res) => {
  try {
    const { categoryNews } = req.params;
    const dataNews = await News.find({ categoryNews }).lean();
    if (!dataNews) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy bài viết này",
      });
    }

    res.status(200).json({
      status: "Success",
      data: dataNews,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// lấy dữ liệu theo id
news.get("/api/news/detail/:NewsId", async (req, res) => {
  try {
    const { NewsId } = req.params;
    const dataNews = await News.findById(NewsId).lean();
    if (!dataNews) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy bài viết này",
      });
    }

    res.status(200).json({
      status: "Success",
      data: dataNews,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


// thêm bài viết
news.post(
  "/api/news",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const { categoryNews, titleNews, imageNews, content } = req.body;
      if (!categoryNews || !titleNews || !imageNews || !content) {
        return res.status(400).json({
          status: "Error",
          message: "Vui lòng điền đầy đủ thông tin",
        });
      }

      const newNews = new News({
        categoryNews,
        titleNews,
        imageNews,
        content,
      });
      await newNews.save();
      return res.status(201).json({
        status: "Success",
        message: "Bài viết đã được thêm thành công",
        data: newNews,
      });
    } catch (error) {
      res.status(500).json({
        status: "Error",
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

// xóa dữ liệu bài viết theo ID
news.delete(
  "/api/news/:newsId",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền xóa bài viết",
        });
      }

      const { newsId } = req.params;
      const deletedNews = await News.findByIdAndDelete(newsId);

      if (!deletedNews) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy bài viết này",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Xóa lịch bài viết thành công",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "Error",
        message: "Lỗi hệ thống",
      });
    }
  }
);

// cập nhật dữ liệu bài viết theo ID
news.put(
  "/api/news/:newsId",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền chỉnh sửa bài viết",
        });
      }

      const { newsId } = req.params;
      const { categoryNews, titleNews, imageNews, content } = req.body;
      const updatedNews = await News.findByIdAndUpdate(
        newsId,
        { categoryNews, titleNews, imageNews, content },
        { new: true }
      );

      if (!updatedNews) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy bài viết này.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật bài viết thành công",
        data: updatedNews,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "Error",
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  }
);

export default news;
