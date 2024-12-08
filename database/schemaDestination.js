import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
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

    entryFee: { type: String },
    activities: [{ type: String }],
  },
  { timestamps: true }
);

// Index cho truy vấn hiệu quả
destinationSchema.index({ location: "2dsphere" });

const Destination = mongoose.model("Destination", destinationSchema);

export default Destination;
