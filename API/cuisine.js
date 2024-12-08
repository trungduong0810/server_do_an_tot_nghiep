import express from "express";
import authentication from "../auth/authApp.js";
import Cuisine from "../database/schemaCuisine.js";
const apiCuisine = express.Router();

// api lấy tất cả các món ăn và phân trang
apiCuisine.get("/api/cuisine", async (req, res) => {
  try {
    const cuisines = await Cuisine.find();
    let allFoods = [];
    cuisines.forEach((province) => {
      province.cuisineDetail.forEach((food) => {
        const { foodName, imgFood, foodDesc, foodId, createdAt, updatedAt } =
          food.toObject();
        allFoods.push({
          foodName,
          imgFood,
          foodDesc,
          foodId,
          createdAt,
          updatedAt,
          provinceName: province.provinceName,
          provinceSlug: province.provinceSlug,
        });
      });
    });

    const page = parseInt(req.query.page) || 1;
    const limit = 15;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const foodsOnPage = allFoods.slice(startIndex, endIndex);
    res.json({
      status: "Success",
      data: foodsOnPage,
      currentPage: page,
      totalPages: Math.ceil(allFoods.length / limit),
      totalItems: allFoods.length,
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// api lấy tất cả món ăn cho phần search
apiCuisine.get("/api/cuisine/search", async (req, res) => {
  try {
    const cuisines = await Cuisine.find();
    let allFoods = [];
    // Duyệt qua tất cả các tỉnh và món ăn trong tỉnh
    cuisines.forEach((province) => {
      province.cuisineDetail.forEach((food) => {
        const { foodName, imgFood, foodDesc, foodId, createdAt, updatedAt } =
          food.toObject();
        allFoods.push({
          foodName,
          imgFood,
          foodDesc,
          foodId,
          createdAt,
          updatedAt,
          provinceName: province.provinceName,
          provinceSlug: province.provinceSlug,
        });
      });
    });

    // Trả về tất cả món ăn mà không phân trang
    res.json({
      status: "Success",
      data: allFoods,
      totalItems: allFoods.length, // Số lượng món ăn
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// Api lấy tất cả tỉnh thành và hình ảnh
apiCuisine.get("/api/cuisine/all", async (req, res) => {
  try {
    const cuisines = await Cuisine.find();
    let allProvinceAndImage = [];
    cuisines.forEach((data) => {
      const {
        _id,
        provinceName,
        provinceSlug,
        regional,
        imgRepresentative,
        cuisineDetail,
      } = data.toObject();
      allProvinceAndImage.push({
        _id,
        provinceName,
        provinceSlug,
        regional,
        imgRepresentative,
        foodCount: cuisineDetail.length,
      });
    });

    res.json({
      status: "Success",
      data: allProvinceAndImage,
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// API lấy những món ăn theo tỉnh thành
apiCuisine.get("/api/cuisine/:province_name", async (req, res) => {
  const { province_name } = req.params;

  try {
    const cuisines = await Cuisine.find({ provinceSlug: province_name });
    if (cuisines.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy món ăn nào cho tỉnh này.",
      });
    }
    res.json({ status: "Success", data: cuisines });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// api lấy tất cả món ăn theo khu vực và phân trang
apiCuisine.get("/api/cuisine/region/:region", async (req, res) => {
  const { region } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  // Sử dụng biểu thức chính quy để tìm kiếm các món ăn theo vùng miền
  const query = new RegExp(`^${region}`, "i"); // 'i' để tìm kiếm không phân biệt chữ hoa chữ thường
  try {
    // Lấy tất cả các món ăn cho khu vực
    const cuisines = await Cuisine.find({ regional: query });

    // Trích xuất cuisineDetail vào một mảng mới
    const cuisineDetails = cuisines.flatMap((cuisine) => cuisine.cuisineDetail);

    // Kiểm tra xem có món ăn nào không
    if (cuisineDetails.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy món ăn nào cho vùng miền này.",
      });
    }

    // Phân trang dữ liệu
    const paginatedCuisines = cuisineDetails.slice(skip, skip + limit); // Lấy phần tử từ skip đến skip + limit
    const totalCuisines = cuisineDetails.length; // Tổng số món ăn
    const totalPages = Math.ceil(totalCuisines / limit); // Tính tổng số trang

    // Chuyển đổi dữ liệu về định dạng mong muốn
    const formattedCuisines = paginatedCuisines.map((cuisine) => ({
      provinceName: cuisines.find((c) =>
        c.cuisineDetail.some((cd) => cd.foodId === cuisine.foodId)
      ).provinceName, // Tìm provinceName từ món ăn
      foodName: cuisine.foodName,
      imgFood: cuisine.imgFood,
      foodDesc: cuisine.foodDesc,
      listImage: cuisine.listImage,
      linkVideo: cuisine.linkVideo,
      foodId: cuisine.foodId,
      createdAt: cuisine.createdAt,
      updatedAt: cuisine.updatedAt,
    }));

    res.json({
      status: "Success",
      data: formattedCuisines,
      currentPage: page,
      totalPages: totalPages,
      totalCuisines: totalCuisines,
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// api lấy món ăn theo foodId
apiCuisine.get("/api/cuisine/food/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Sử dụng $elemMatch để tìm cuisine chứa foodId
    const cuisine = await Cuisine.findOne({
      cuisineDetail: { $elemMatch: { foodId: id } },
    });

    if (!cuisine) {
      return res
        .status(404)
        .json({ status: "Error", message: "Food not found" });
    }
    // Lấy món ăn cụ thể từ cuisineDetail
    const food = cuisine.cuisineDetail.find((food) => food.foodId === id);

    if (food) {
      const {
        foodName,
        imgFood,
        foodDesc,
        listImage,
        foodId,
        createdAt,
        updatedAt,
      } = food.toObject();
      res.json({
        status: "Success",
        data: {
          foodName,
          imgFood,
          listImage,
          foodDesc,
          foodId,
          createdAt,
          updatedAt,
        },
      });
    } else {
      res.status(404).json({ status: "Error", message: "Food not found" });
    }
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// api post món ăn
apiCuisine.post(
  "/api/cuisine",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền thêm dữ liệu",
        });
      }

      const {
        provinceName,
        provinceSlug,
        regional,
        imgRepresentative,
        foodName,
        imgFood,
        foodDesc,
        listImage,
        linkVideo,
      } = req.body;

      if (
        !provinceName ||
        !provinceSlug ||
        !regional ||
        !foodName ||
        !imgFood ||
        !foodDesc ||
        !listImage
      ) {
        return res.status(400).json({
          status: "Error",
          message: "Vui lòng nhập đầy đủ thông tin",
        });
      }

      // Tìm tỉnh theo slug
      const existingCuisine = await Cuisine.findOne({ provinceSlug });

      if (existingCuisine) {
        // Kiểm tra trùng lặp foodName
        const foodExists = existingCuisine.cuisineDetail.some(
          (item) => item.foodName === foodName
        );

        if (foodExists) {
          return res.status(409).json({
            status: "Error",
            message: "Tên món ăn đã tồn tại trong tỉnh này.",
          });
        }

        // Nếu tỉnh đã tồn tại, thêm món ăn mới vào cuisineDetail
        existingCuisine.cuisineDetail.push({
          foodName,
          imgFood,
          foodDesc,
          listImage,
          linkVideo,
        });
        await existingCuisine.save();

        return res.status(200).json({
          status: "Success",
          message: "Thêm món ăn mới thành công",
          data: existingCuisine,
        });
      } else {
        // Nếu tỉnh chưa tồn tại, tạo mới
        const newCuisine = new Cuisine({
          provinceName,
          provinceSlug,
          regional,
          imgRepresentative,
          cuisineDetail: [
            {
              foodName,
              imgFood,
              foodDesc,
              listImage,
              linkVideo,
            },
          ],
        });
        await newCuisine.save();

        return res.status(201).json({
          status: "Success",
          message: "Thêm thông tin ẩm thực thành công",
          data: newCuisine,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "Error",
        message: "Lỗi hệ thống",
      });
    }
  }
);

// xóa món ăn theo tỉnh thành và id của món ăn đó
apiCuisine.delete(
  "/api/cuisine/:provinceSlug/:foodId",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền xóa dữ liệu",
        });
      }

      const { provinceSlug, foodId } = req.params;

      const existingCuisine = await Cuisine.findOne({ provinceSlug });

      if (!existingCuisine) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy tỉnh này.",
        });
      }

      const foodIndex = existingCuisine.cuisineDetail.findIndex(
        (item) => item.foodId === foodId
      );

      if (foodIndex === -1) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy món ăn này.",
        });
      }

      existingCuisine.cuisineDetail.splice(foodIndex, 1);
      await existingCuisine.save();

      return res.status(200).json({
        status: "Success",
        message: "Xóa món ăn thành công",
        data: existingCuisine,
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

// cập nhật món ăn theo tỉnh thành và id của món ăn
apiCuisine.put(
  "/api/cuisine/:provinceSlug/:foodId",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền cập nhật dữ liệu",
        });
      }

      const { provinceSlug, foodId } = req.params;
      const { foodName, imgFood, foodDesc, listImage } = req.body;

      const updatedCuisine = await Cuisine.findOneAndUpdate(
        {
          provinceSlug,
          "cuisineDetail.foodId": foodId,
        },
        {
          $set: {
            "cuisineDetail.$.foodName": foodName,
            "cuisineDetail.$.imgFood": imgFood,
            "cuisineDetail.$.foodDesc": foodDesc,
            "cuisineDetail.$.listImage": listImage,
          },
        },
        { new: true }
      );

      if (!updatedCuisine) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy tỉnh hoặc món ăn này.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật món ăn thành công",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "Error",
        message: "Lỗi hệ thống",
      });
    }
  }
);

export default apiCuisine;
