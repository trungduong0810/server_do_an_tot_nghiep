import express from "express";
import authentication from "../auth/authApp.js";
import Restaurant from "../database/schemaRestaurant.js";

const apiRestaurant = express.Router();

// api lấy tất cả các nhà hàng
apiRestaurant.get("/api/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select("-__v"); // Loại bỏ trường `__v`

    res.json({
      restaurantItems: restaurants,
      totalItems: restaurants.length,
    });
  } catch (error) {
    console.log("Lỗi:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//api lấy 1 nhà hàng theo id
apiRestaurant.get("/api/restaurant/:_id", async (req, res) => {
  try {
    const { _id } = req.params;

    if (!_id) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const restaurant = await Restaurant.findById(_id, { __v: 0 });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// api thêm nhà hàng
apiRestaurant.post(
  "/api/restaurant",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền thêm nhà hàng.",
        });
      }

      const {
        name,
        category,
        description,
        images,
        location,
        opening_hours,
        utilities,
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

      const newRestaurant = new Restaurant({
        name,
        category,
        description,
        images,
        location,
        opening_hours,
        utilities,
      });

      await newRestaurant.save();

      return res.status(201).json({
        status: "Success",
        message: "Thêm nhà hàng thành công.",
        data: newRestaurant,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

//api cập nhật nhà hàng
apiRestaurant.put(
  "/api/restaurant/:_id",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền cập nhật nhà hàng.",
        });
      }

      const { _id } = req.params;
      const { name, category, description, images, location, opening_hours } =
        req.body;

      const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        _id,
        {
          name,
          category,
          description,
          images,
          location,
          opening_hours,
        },
        { new: true, runValidators: true }
      );

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

      if (!updatedRestaurant) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy nhà hàng cần cập nhật.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật nhà hàng thành công.",
        data: updatedRestaurant,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

//api xóa nhà hàng
apiRestaurant.delete(
  "/api/restaurant/:_id",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền xóa nhà hàng.",
        });
      }

      const { _id } = req.params;

      const deletedRestaurant = await Restaurant.findByIdAndDelete(_id);

      if (!deletedRestaurant) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy nhà hàng cần xóa.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Xóa nhà hàng thành công.",
        data: deletedRestaurant,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

// api cập nhật số sao, số lượt đánh giá
apiRestaurant.put(
  "/api/restaurant/review/:id",
  authentication.verifyAccessToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, rating_count } = req.body;

      // Kiểm tra thông tin đầu vào
      if (rating < 0 || rating > 5) {
        return res.status(400).json({
          status: "Error",
          message: "Rating phải nằm trong khoảng từ 0 đến 5.",
        });
      }

      if (rating_count < 0) {
        return res.status(400).json({
          status: "Error",
          message: "Số lượt đánh giá không được nhỏ hơn 0.",
        });
      }

      // Cập nhật rating và rating_count
      const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        id,
        {
          rating,
          rating_count,
        },
        { new: true, runValidators: true }
      );

      // Kiểm tra nếu không tìm thấy nhà hàng
      if (!updatedRestaurant) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy nhà hàng cần cập nhật.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật đánh giá nhà hàng thành công.",
        data: updatedRestaurant,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

export default apiRestaurant;
