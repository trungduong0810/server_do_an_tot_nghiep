import AWS from "aws-sdk";
import express from "express";
import authentication from "../auth/authApp.js";
import Destination from "../database/schemaDestination.js";

const apiDestination = express.Router();

// api lấy tất cả các địa điểm
apiDestination.get("/api/destinations", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const province = req.query.province; // Lấy tỉnh từ query
    const excludeId = req.query.excludeId; // Loại trừ ID địa điểm hiện tại (nếu có)

    // Tạo bộ lọc tùy chọn
    const filter = {};
    if (province) {
      filter["location.address"] = { $regex: new RegExp(province, "i") };
    }

    if (excludeId) {
      filter._id = { $ne: excludeId }; // Loại trừ địa điểm hiện tại
    }

    // Tìm kiếm và phân trang
    const destinations = await Destination.find(filter)
      .skip(skip)
      .limit(limit)
      .select("-__v"); // Loại bỏ trường `__v`

    // Đếm tổng số mục phù hợp
    const totalItems = await Destination.countDocuments(filter);

    res.json({
      destinationItems: destinations, // Gửi dữ liệu đã thêm imageUrls
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// api lấy 1 địa điểm theo tên
apiDestination.get("/api/destinations/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const destinations = await Destination.find(
      { name: { $regex: new RegExp(name, "i") } },
      { __v: 0 }
    );

    if (destinations.length === 0) {
      return res.status(404).json({ message: "Destination not found" });
    }

    const destination = destinations[0];

    res.json({
      destination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// api lấy địa điểm cho trang admin và map
apiDestination.get("/api/v2/destinations", async (req, res) => {
  try {
    const destinations = await Destination.find().select("-__v"); // Loại bỏ trường `__v`

    res.json({
      destinationItems: destinations,
      totalItems: destinations.length,
    });
  } catch (error) {
    console.log("Lỗi:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// api thêm địa điểm
apiDestination.post(
  "/api/destination",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền thêm địa điểm.",
        });
      }

      const {
        name,
        category,
        description,
        images,
        location,
        opening_hours,
        entryFee,
        activities,
      } = req.body;

      if (!name || !category || !location) {
        return res.status(400).json({
          status: "Error",
          message:
            "Vui lòng nhập đầy đủ thông tin bắt buộc (name, category, location).",
        });
      }

      if (location.coordinates[1] < -90 || location.coordinates[1] > 90) {
        return res.status(400).json({
          status: "Error",
          message: "Vĩ độ phải nằm trong khoảng -90 đến 90",
        });
      }
      if (location.coordinates[0] < -180 || location.coordinates[0] > 180) {
        return res.status(400).json({
          status: "Error",
          message: "Kinh độ phải nằm trong khoảng -180 đến 180).",
        });
      }

      const newDestination = new Destination({
        name,
        category,
        description,
        images,
        location,
        opening_hours,
        entryFee,
        activities,
      });

      await newDestination.save();

      return res.status(201).json({
        status: "Success",
        message: "Thêm địa điểm thành công.",
        data: newDestination,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

//api cập nhật địa điểm
apiDestination.put(
  "/api/destination/:_id",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền cập nhật địa điểm.",
        });
      }

      const { _id } = req.params;

      const {
        name,
        category,
        description,
        images,
        location,
        opening_hours,
        entryFee,
        activities,
      } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!name || !category || !location) {
        return res.status(400).json({
          status: "Error",
          message:
            "Vui lòng nhập đầy đủ thông tin bắt buộc (name, category, location).",
        });
      }

      if (location.coordinates[1] < -90 || location.coordinates[1] > 90) {
        return res.status(400).json({
          status: "Error",
          message: "Vĩ độ phải nằm trong khoảng -90 đến 90",
        });
      }
      if (location.coordinates[0] < -180 || location.coordinates[0] > 180) {
        return res.status(400).json({
          status: "Error",
          message: "Kinh độ phải nằm trong khoảng -180 đến 180.",
        });
      }

      const existingDestination = await Destination.findById(_id);
      if (!existingDestination) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy địa điểm cần cập nhật.",
        });
      }

      // Cập nhật thông tin địa điểm
      const updatedDestination = await Destination.findByIdAndUpdate(
        _id,
        {
          name,
          category,
          description,
          images,
          location,
          opening_hours,
          entryFee,
          activities,
        },
        { new: true }
      );

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật địa điểm thành công.",
        data: updatedDestination,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

//api xóa địa điểm
apiDestination.delete(
  "/api/destination/:_id",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền xóa địa điểm.",
        });
      }

      const { _id } = req.params;

      const deletedDestination = await Destination.findByIdAndDelete(_id);

      if (!deletedDestination) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy địa điểm cần xóa.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Xóa địa điểm thành công.",
        data: deletedDestination,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

// api cập nhật số sao và số lượt đánh giá theo name
apiDestination.put(
  "/api/destination/review/:id",
  authentication.verifyAccessToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, rating_count } = req.body;

      if (rating === undefined || rating_count === undefined) {
        return res.status(400).json({
          status: "Error",
          message: "Vui lòng nhập rating và rating_count.",
        });
      }

      if (rating < 0 || rating > 5) {
        return res.status(400).json({
          status: "Error",
          message: "Số sao (rating) phải nằm trong khoảng 0 đến 5.",
        });
      }

      if (rating_count < 0) {
        return res.status(400).json({
          status: "Error",
          message: "Số lượt đánh giá (rating_count) phải lớn hơn hoặc bằng 0.",
        });
      }

      // Tìm địa điểm theo tên
      const destination = await Destination.findById(id);
      if (!destination) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy địa điểm với tên đã cung cấp.",
        });
      }

      // Cập nhật rating và rating_count
      destination.rating = rating;
      destination.rating_count = rating_count;

      // Lưu lại địa điểm đã được cập nhật
      const updatedDestination = await destination.save();

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật số sao và số lượt đánh giá thành công.",
        data: updatedDestination,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

export default apiDestination;
