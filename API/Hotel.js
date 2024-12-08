import express from "express";
import authentication from "../auth/authApp.js";
import Hotels from "../database/schemaHotel.js";
import { uuid } from "uuidv4";

const apiHotel = express.Router();

// lấy tất cả các khách sạn và phân trang
apiHotel.get("/api/hotels", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const hotels = await Hotels.aggregate([
      { $unwind: "$hotelItem" },
      { $skip: skip },
      { $limit: limit },
      { $project: { hotelItem: 1, _id: 0 } },
    ]);

    const totalItems = await Hotels.aggregate([
      { $unwind: "$hotelItem" },
      { $count: "totalCount" },
    ]);

    const totalItemCount = totalItems[0]?.totalCount || 0;

    res.json({
      hotelItems: hotels.map((hotel) => hotel.hotelItem),
      currentPage: page,
      totalPages: Math.ceil(totalItemCount / limit),
      totalItems: totalItemCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// lấy 1 khách sạn của 1 tỉnh thành
apiHotel.get("/api/search/hotels", async (req, res) => {
  try {
    const hotels = await Hotels.aggregate([
      { $unwind: "$hotelItem" }, // Tách từng phần tử trong mảng hotelItem
      {
        $project: {
          hotel: 1, // Lấy tên khách sạn (ví dụ: Hà Nội)
          name: "$hotelItem.name", // Tên của hotelItem
          image: "$hotelItem.image", // Ảnh của hotelItem
          _id: 0, // Loại bỏ _id
        },
      },
    ]);
    res.json({
      hotels: hotels,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// API lấy tất cả tên tỉnh thành từ các khách sạn
apiHotel.get("/api/hotel-provinces", async (req, res) => {
  try {
    const provinces = await Hotels.aggregate([
      { $group: { _id: "$hotel" } },
      { $project: { province: "$_id", _id: 0 } },
    ]);

    res.json({
      provinces: provinces.map((province) => province.province),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// api lấy khách sạn theo tên tỉnh thành, theo số sao và  phân trang
apiHotel.get("/api/hotels/:hotel", async (req, res) => {
  try {
    const hotel = req.params.hotel;
    const stars = parseInt(req.query.stars);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Xây dựng query filter
    let matchCondition = { hotelSlug: hotel };
    if (!isNaN(stars)) {
      matchCondition["hotelItem.stars"] = stars;
    }

    // Sử dụng aggregate để lọc theo hotel và stars, đồng thời phân trang
    const hotels = await Hotels.aggregate([
      { $match: matchCondition },
      { $unwind: "$hotelItem" },
      { $match: isNaN(stars) ? {} : { "hotelItem.stars": stars } },
      { $skip: skip },
      { $limit: limit },
      {
        $addFields: {
          "hotelItem.hotelSlug": "$hotelSlug",
        },
      },
      {
        $project: {
          "hotelItem.id": 1,
          "hotelItem.name": 1,
          "hotelItem.image": 1,
          "hotelItem.stars": 1,
          "hotelItem.category": 1,
          "hotelItem.hotelSlug": 1,
          "hotelItem.numberOfReview": 1,
          "hotelItem.reviewScore": 1,
          "hotelItem.reviewText": 1,
          "hotelItem.location": 1,
          "hotelItem.listIntroduce": 1,
          _id: 0,
        },
      },
    ]);

    // Đếm tổng số phần tử của hotelItem dựa trên điều kiện lọc
    const totalItems = await Hotels.aggregate([
      { $match: matchCondition },
      { $unwind: "$hotelItem" },
      { $match: isNaN(stars) ? {} : { "hotelItem.stars": stars } },
      { $count: "totalCount" },
    ]);

    const totalItemCount = totalItems[0]?.totalCount || 0;

    res.json({
      hotelItems: hotels.map((hotel) => hotel.hotelItem),
      currentPage: page,
      totalPages: Math.ceil(totalItemCount / limit),
      totalItems: totalItemCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// tìm kiếm theo name
apiHotel.get("/api/hotels/detail/:name", async (req, res) => {
  try {
    const hotelName = req.params.name;

    // Tìm kiếm khách sạn theo tên
    const hotelDetail = await Hotels.aggregate([
      { $unwind: "$hotelItem" },
      { $match: { "hotelItem.name": { $regex: hotelName, $options: "i" } } },
      { $project: { hotelItem: 1, _id: 0 } },
    ]);

    if (hotelDetail.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json(hotelDetail[0]); // Trả về thông tin chi tiết của khách sạn đầu tiên tìm thấy
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// lấy số lượng khách sạn cho page manage hotel
apiHotel.get("/api/admin/hotels", async (req, res) => {
  try {
    const hotelStats = await Hotels.aggregate([
      {
        $project: {
          hotel: 1,
          hotelItemCount: { $size: "$hotelItem" },
        },
      },
      {
        $group: {
          _id: "$hotel",
          totalHotels: { $sum: 1 },
          totalHotelItems: { $sum: "$hotelItemCount" },
        },
      },
      {
        $addFields: { placeName: "$_id" },
      },
      {
        $project: {
          _id: 0,
          placeName: 1,
          totalHotelItems: 1,
        },
      },
    ]);

    // Tính tổng số tất cả hotelItem và tổng số khách sạn trong toàn bộ collection
    const totalHotels = hotelStats.length;
    const totalHotelItems = hotelStats.reduce(
      (sum, hotel) => sum + hotel.totalHotelItems,
      0
    );

    res.json({
      totalHotels: totalHotels,
      totalHotelItems: totalHotelItems,
      hotelStats: hotelStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// lấy hotle theo tỉnh thành page admin
apiHotel.get(
  "/api/admin/hotels/:hotel",
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
      const hotel = req.params.hotel;
      let matchCondition = { hotelSlug: hotel };
      const hotels = await Hotels.aggregate([
        { $match: matchCondition },
        { $unwind: "$hotelItem" },
        { $project: { hotelItem: 1, _id: 0 } },
      ]);

      const totalItems = await Hotels.aggregate([
        { $match: matchCondition },
        { $unwind: "$hotelItem" },
        { $count: "totalCount" },
      ]);

      const totalItemCount = totalItems[0]?.totalCount || 0;

      res.json({
        hotelItems: hotels.map((hotel) => hotel.hotelItem),
        totalItems: totalItemCount,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//api thêm khách sạn
apiHotel.post(
  "/api/hotel",
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
        name,
        category,
        image,
        stars,
        reviewScore,
        reviewText,
        numberOfReview,
        facilities,
        infoHotel,
        listIntroduce,
        urlMap,
        location,
        imageDetails,
      } = req.body;

      // Kiểm tra các thông tin bắt buộc
      if (
        !provinceName ||
        !provinceSlug ||
        !name ||
        !category ||
        !location.coordinates
      ) {
        return res.status(400).json({
          status: "Error",
          message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
        });
      }

      // Kiểm tra tọa độ hợp lệ
      const [longitude, latitude] = location.coordinates;
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          status: "Error",
          message: "Vĩ độ phải nằm trong khoảng -90 đến 90",
        });
      }
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          status: "Error",
          message: "Kinh độ phải nằm trong khoảng -180 đến 180",
        });
      }

      const hotelId = uuid();

      // Tìm tỉnh theo slug
      const existingProvince = await Hotels.findOne({
        hotelSlug: provinceSlug,
      });

      if (existingProvince) {
        // Kiểm tra trùng lặp khách sạn
        const hotelExists = existingProvince.hotelItem.some(
          (item) => item.name === name
        );

        if (hotelExists) {
          return res.status(409).json({
            status: "Error",
            message: "Tên khách sạn đã tồn tại trong tỉnh này.",
          });
        }

        // Nếu tỉnh đã tồn tại, thêm khách sạn mới vào hotelItems
        existingProvince.hotelItem.push({
          id: hotelId,
          name,
          category,
          image,
          stars,
          reviewScore,
          reviewText,
          numberOfReview,
          facilities,
          infoHotel,
          listIntroduce,
          urlMap,
          location,
          imageDetails,
        });
        await existingProvince.save();

        return res.status(200).json({
          status: "Success",
          message: "Thêm khách sạn mới thành công",
          data: existingProvince,
        });
      } else {
        // Nếu tỉnh chưa tồn tại, tạo mới
        const newProvince = new Hotels({
          hotel: provinceName,
          hotelSlug: provinceSlug,
          hotelItems: [
            {
              id: hotelId,
              name,
              category,
              image,
              stars,
              reviewScore,
              reviewText,
              numberOfReview,
              facilities,
              infoHotel,
              listIntroduce,
              urlMap,
              location,
              imageDetails,
            },
          ],
        });
        await newProvince.save();

        return res.status(201).json({
          status: "Success",
          message: "Thêm thông tin khách sạn thành công",
          data: newProvince,
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

//api cập nhật khách sạn
apiHotel.put(
  "/api/hotel/:slug/:id",
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

      const { slug, id } = req.params;

      const {
        name,
        category,
        image,
        facilities,
        infoHotel,
        listIntroduce,
        urlMap,
        location,
        imageDetails,
      } = req.body;

      // Kiểm tra các thông tin bắt buộc
      if (!name || !imageDetails || !location.coordinates) {
        return res.status(400).json({
          status: "Error",
          message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
        });
      }

      // Kiểm tra tọa độ hợp lệ
      const [longitude, latitude] = location.coordinates;
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          status: "Error",
          message: "Vĩ độ phải nằm trong khoảng -90 đến 90",
        });
      }
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          status: "Error",
          message: "Kinh độ phải nằm trong khoảng -180 đến 180",
        });
      }

      // Tìm tỉnh theo slug
      const province = await Hotels.findOne({
        hotelSlug: slug,
      });

      if (!province) {
        return res.status(404).json({
          status: "Error",
          message: "Tỉnh không tồn tại",
        });
      }

      // Tìm khách sạn trong tỉnh
      const hotelIndex = province.hotelItem.findIndex(
        (hotel) => hotel.id === id
      );

      if (hotelIndex === -1) {
        return res.status(404).json({
          status: "Error",
          message: "Khách sạn không tồn tại trong tỉnh này",
        });
      }

      // Cập nhật thông tin khách sạn
      province.hotelItem[hotelIndex] = {
        ...province.hotelItem[hotelIndex],
        name: name || province.hotelItem[hotelIndex].name,
        category: category || province.hotelItem[hotelIndex].category,
        image: image || province.hotelItem[hotelIndex].image,
        facilities: facilities || province.hotelItem[hotelIndex].facilities,
        infoHotel: infoHotel || province.hotelItem[hotelIndex].infoHotel,
        listIntroduce:
          listIntroduce || province.hotelItem[hotelIndex].listIntroduce,
        urlMap: urlMap || province.hotelItem[hotelIndex].urlMap,
        location: location || province.hotelItem[hotelIndex].location,
        imageDetails:
          imageDetails || province.hotelItem[hotelIndex].imageDetails,
        id: province.hotelItem[hotelIndex].id,
      };

      await province.save();

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật khách sạn thành công",
        data: province.hotelItem[hotelIndex],
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

// API xóa khách sạn theo id
apiHotel.delete(
  "/api/hotels/:id",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền xóa khách sạn.",
        });
      }

      const { id } = req.params;

      // Xóa phần tử trong mảng `hotelItem`
      const updatedHotel = await Hotels.findOneAndUpdate(
        { "hotelItem.id": id },
        { $pull: { hotelItem: { id } } },
        { new: true }
      );

      if (!updatedHotel) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy khách sạn cần xóa.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Xóa khách sạn thành công.",
        data: updatedHotel,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Error", message: "Lỗi hệ thống." });
    }
  }
);

// api cập nhật khách sạn theo name
apiHotel.put("/api/hotels/:hotelSlug", async (req, res) => {
  try {
    const { hotelSlug } = req.params; // Lấy hotelSlug từ URL
    const {
      name,
      stars,
      image,
      reviewScore,
      reviewText,
      numberOfReview,
      address,
      facilities,
      infoHotel,
      listIntroduce,
      latitude,
      longitude,
      imageDetails,
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name) {
      return res
        .status(400)
        .json({ message: "Tên khách sạn không được để trống" });
    }

    // Tạo đối tượng cập nhật
    const updateFields = {};
    if (stars !== undefined) updateFields["hotelItem.$.stars"] = stars;
    if (numberOfReview !== undefined)
      updateFields["hotelItem.$.numberOfReview"] = numberOfReview;
    if (image) updateFields["hotelItem.$.image"] = image;
    if (reviewScore) updateFields["hotelItem.$.reviewScore"] = reviewScore;
    if (reviewText) updateFields["hotelItem.$.reviewText"] = reviewText;
    if (address) updateFields["hotelItem.$.address"] = address;
    if (facilities) updateFields["hotelItem.$.facilities"] = facilities;
    if (infoHotel) updateFields["hotelItem.$.infoHotel"] = infoHotel;
    if (listIntroduce)
      updateFields["hotelItem.$.listIntroduce"] = listIntroduce;
    if (latitude) updateFields["hotelItem.$.latitude"] = latitude;
    if (longitude) updateFields["hotelItem.$.longitude"] = longitude;
    if (imageDetails) updateFields["hotelItem.$.imageDetails"] = imageDetails;

    // Tìm kiếm và cập nhật
    const result = await Hotels.findOneAndUpdate(
      { hotelSlug, "hotelItem.name": name },
      { $set: updateFields },
      { new: true, projection: { hotelItem: { $elemMatch: { name } } } } // Chỉ lấy phần tử cập nhật
    );

    // Kiểm tra nếu không tìm thấy
    if (!result || !result.hotelItem.length) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy khách sạn hoặc mục cần cập nhật" });
    }

    // Trả về mục đã được cập nhật
    res
      .status(200)
      .json({ message: "Cập nhật thành công", data: result.hotelItem[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi máy chủ", error });
  }
});

export default apiHotel;
