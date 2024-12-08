import express from "express";
import itinerary from "../database/schemaTravelItinerary.js";
import authentication from "../auth/authApp.js";
const apiItinerary = express.Router();

// lấy số lượng lịch trình
apiItinerary.get("/api/itineraries", async (req, res) => {
  try {
    const totalItineraries = await itinerary.aggregate([
      { $unwind: "$itineraryDetail" },
      { $count: "total" },
    ]);
    const total = totalItineraries.length > 0 ? totalItineraries[0].total : 0;
    res.json({ status: "Success", totalItineraries: total });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// lấy dữ liệu theo provinceSlug
apiItinerary.get("/api/itineraries/:provinceSlug", async (req, res) => {
  try {
    const { provinceSlug } = req.params;
    const itineraries = await itinerary.find({ provinceSlug });

    if (itineraries.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy hành trình cho slug đã cung cấp",
      });
    }

    res.status(200).json({
      status: "Success",
      data: itineraries,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// thêm dữ liệu từ lộ trình
apiItinerary.post(
  "/api/itineraries",
  // authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const { provinceName, provinceSlug, timeTrip, content, userCreate } =
        req.body;
      if (
        !provinceName ||
        !provinceSlug ||
        !timeTrip ||
        !content ||
        !userCreate
      ) {
        return res.status(400).json({
          status: "Error",
          message: "Vui lòng điền đẩy đủ thông tin",
        });
      }

      // Cấu trúc chi tiết hành trình
      const newDetail = {
        timeTrip: timeTrip,
        content: content,
        userCreate: userCreate,
      };

      // Tìm kiếm theo provinceName và provinceSlug
      const existingItinerary = await itinerary.findOne({
        provinceName,
        provinceSlug,
      });

      if (existingItinerary) {
        existingItinerary.itineraryDetail.push(newDetail);
        await existingItinerary.save();

        res.status(200).json({
          status: "Success",
          message: "Cập nhật lịch trình thành công",
          data: existingItinerary,
        });
      } else {
        const newItinerary = new itinerary({
          provinceName,
          provinceSlug,
          itineraryDetail: [newDetail],
        });

        await newItinerary.save();

        res.status(201).json({
          status: "Success",
          message: "Tạo mới lịch trình thành công",
          data: newItinerary,
        });
      }
    } catch (error) {
      res.status(500).json({
        status: "Error",
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

// xóa dữ  liệu theo ID
apiItinerary.delete(
  "/api/itineraries/:provinceSlug/:itineraryDetailId",
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

      const { provinceSlug, itineraryDetailId } = req.params;

      // Tìm kiếm lịch trình theo tỉnh
      const existingItinerary = await itinerary.findOne({ provinceSlug });

      if (!existingItinerary) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy tỉnh này.",
        });
      }

      // Tìm vị trí của chi tiết lịch trình
      const itineraryDetailIndex = existingItinerary.itineraryDetail.findIndex(
        (item) => item._id.toString() === itineraryDetailId
      );

      console.log(itineraryDetailIndex);

      if (itineraryDetailIndex === -1) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy lịch trình này.",
        });
      }

      existingItinerary.itineraryDetail.splice(itineraryDetailIndex, 1);
      await existingItinerary.save();

      return res.status(200).json({
        status: "Success",
        message: "Xóa lịch trình thành công",
        data: existingItinerary,
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

// cập nhật dữ liệu theo tỉnh thành slug và id lịch trình
apiItinerary.put(
  "/api/itineraries/:provinceSlug/:itineraryDetailId",
  authentication.verifyAccessTokenAdmin,
  async (req, res) => {
    try {
      const userRole = req.user.role;
      if (userRole !== "admin") {
        return res.status(403).json({
          status: "Error",
          message: "Chỉ quản trị viên mới có quyền cập nhật dữ liệu",
        });
      }

      const { provinceSlug, itineraryDetailId } = req.params;
      const { timeTrip, content } = req.body;

      // Tìm kiếm lịch trình theo tỉnh
      const existingItinerary = await itinerary.findOne({ provinceSlug });

      if (!existingItinerary) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy tỉnh này.",
        });
      }

      // Tìm vị trí của chi tiết lịch trình
      const itineraryDetailIndex = existingItinerary.itineraryDetail.findIndex(
        (item) => item._id.toString() === itineraryDetailId
      );

      if (itineraryDetailIndex === -1) {
        return res.status(404).json({
          status: "Error",
          message: "Không tìm thấy lịch trình này.",
        });
      }

      // Cập nhật chi tiết lịch trình
      existingItinerary.itineraryDetail[itineraryDetailIndex].timeTrip =
        timeTrip ||
        existingItinerary.itineraryDetail[itineraryDetailIndex].timeTrip;
      existingItinerary.itineraryDetail[itineraryDetailIndex].content =
        content ||
        existingItinerary.itineraryDetail[itineraryDetailIndex].content;

      await existingItinerary.save();

      return res.status(200).json({
        status: "Success",
        message: "Cập nhật lịch trình thành công",
        data: existingItinerary,
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

export default apiItinerary;
