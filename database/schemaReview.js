import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema(
  {
    nameplate: { type: String, required: true },
    nameplateSlug: { type: String, required: true },
    userId: { type: String, required: true },
    star: { type: Number, required: true },
    evaluate: { type: String, required: true },
    reviewContent: { type: String },
    reviewImages: { type: Array, default: [] },
  },
  { timestamps: true }
);

const Review = mongoose.model("reviews", reviewSchema);

export default Review;
