import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    rating: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    images: [{ type: String }],
    location: {
      type: { type: String, default: "Point" },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: { type: String, required: true },
    },
    opening_hours: {
      open: { type: String },
      close: { type: String },
    },
    utilities: [{ type: String }],
  },
  { timestamps: true }
);

restaurantSchema.index({ location: "2dsphere" });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
