import mongoose from "mongoose";
const hotelSchema = new mongoose.Schema(
  {
    hotel: { type: String, required: true },
    hotelSlug: { type: String, required: true },
    hotelItem: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        category: { type: String, default: "Khách sạn" },
        image: { type: String },
        stars: { type: Number },
        reviewScore: { type: String },
        reviewText: { type: String },
        numberOfReview: { type: Number },
        facilities: [{ type: String }],
        infoHotel: [{ type: String }],
        listIntroduce: [{ type: String }],
        location: {
          type: { type: String, default: "Point" },
          coordinates: {
            type: [Number],
            required: true,
          },
          address: { type: String, required: true },
        },
        imageDetails: [{ type: String }],
      },
    ],
  },
  { timestamps: true }
);

hotelSchema.index({ location: "2dsphere" });

const Hotels = mongoose.model("Hotels", hotelSchema);

export default Hotels;
