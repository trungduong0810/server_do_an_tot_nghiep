import express from "express";
import Restaurant from "../database/schemaRestaurant.js";
import Destination from "../database/schemaDestination.js";
import Hotels from "../database/schemaHotel.js";

const apiMap = express.Router();

apiMap.get("/api/map/viewport", async (req, res) => {
  try {
    const { sw_lat, sw_lng, ne_lat, ne_lng, limit } = req.query;

    if (!sw_lat || !sw_lng || !ne_lat || !ne_lng) {
      return res.status(400).json({
        status: "Error",
        message: "Thiếu tọa độ viewport (sw_lat, sw_lng, ne_lat, ne_lng).",
      });
    }

    const viewportPolygon = {
      type: "Polygon",
      coordinates: [
        [
          [parseFloat(sw_lng), parseFloat(sw_lat)],
          [parseFloat(ne_lng), parseFloat(sw_lat)],
          [parseFloat(ne_lng), parseFloat(ne_lat)],
          [parseFloat(sw_lng), parseFloat(ne_lat)],
          [parseFloat(sw_lng), parseFloat(sw_lat)],
        ],
      ],
    };

    const filter = {
      location: { $geoWithin: { $geometry: viewportPolygon } },
    };
    const filterHotels = {
      "hotelItem.location": { $geoWithin: { $geometry: viewportPolygon } },
    };

    const limitPerType = parseInt(limit) || 50;

    // Lấy dữ liệu từ từng schema
    const [restaurants, hotels, destinations] = await Promise.all([
      Restaurant.find(filter).limit(limitPerType),
      Hotels.find(filterHotels).limit(limitPerType),
      Destination.find(filter).limit(limitPerType),
    ]);

    // Chuẩn hóa dữ liệu từ từng schema
    const formattedData = [
      ...restaurants.map((doc) => ({
        id: doc._id,
        name: doc.name,
        category: doc.category,
        location: doc.location,
        images: doc.images,
        description: doc.description,
        rating: doc.rating,
        rating_count: doc.rating_count,
        opening_hours: doc.opening_hours,
        utilities: doc.utilities,
      })),

      ...hotels.flatMap((doc) =>
        doc.hotelItem
          .filter((item) => item.location && item.location.coordinates)
          .map((item) => ({
            id: item.id,
            name: item.name,
            image: item.image || [],
            hotelSlug: doc.hotelSlug,
            category: item.category,
            stars: item.stars,
            numberOfReview: item.numberOfReview,
            location: item.location,
          }))
      ),

      ...destinations.map((doc) => ({
        id: doc._id,
        name: doc.name,
        category: doc.category,
        rating: doc.rating,
        rating_count: doc.rating_count,
        location: doc.location,
        images: doc.images,
        imageUrls: doc.images.map(
          (key) => `${process.env.BUCKET_BASE_URL}${key}`
        ),
      })),
    ];

    res.status(200).json({
      status: "Success",
      totalItems: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: "Lỗi hệ thống.",
    });
  }
});

// apiMap.get("/api/map/nearby", async (req, res) => {
//   try {
//     const { lat, lng, radius } = req.query;

//     if (!lat || !lng || !radius) {
//       return res.status(400).json({
//         status: "Error",
//         message: "Thiếu thông tin vị trí hoặc bán kính.",
//       });
//     }

//     const radiusInRadians = radius / 6371; // Chuyển bán kính sang radian (6371 km = bán kính Trái Đất)

//     const filter = {
//       location: {
//         $geoWithin: {
//           $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
//         },
//       },
//     };

//     const limitPerType = 50;

//     // Lấy dữ liệu từ các schema
//     const [restaurants, destinations] = await Promise.all([
//       Restaurant.find(filter).limit(limitPerType),
//       Destination.find(filter).limit(limitPerType),
//     ]);

//     // Chuẩn hóa dữ liệu từ các schema
//     const formattedData = [
//       ...restaurants.map((doc) => ({
//         id: doc._id,
//         name: doc.name,
//         category: doc.category,
//         location: doc.location,
//         images: doc.images,
//       })),
//       ...destinations.map((doc) => ({
//         id: doc._id,
//         name: doc.name,
//         category: doc.category,
//         location: doc.location,
//         images: doc.images,
//       })),
//     ];

//     console.log(formattedData);

//     res.status(200).json({
//       status: "Success",
//       totalItems: formattedData.length,
//       data: formattedData,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: "Error",
//       message: "Lỗi hệ thống.",
//     });
//   }
// });

export default apiMap;
