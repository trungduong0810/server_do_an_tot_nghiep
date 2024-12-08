import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    categoryNews: { type: String, required: true, index: true },
    titleNews: { type: String, required: true },
    imageNews: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const News = mongoose.model("News", newsSchema);

export default News;
