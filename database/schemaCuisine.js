import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const provinceSchema = new mongoose.Schema({
  provinceName: { type: String, required: true },
  provinceSlug: { type: String, required: true },
  regional: { type: String, required: true },
  imgRepresentative: { type: String },
  cuisineDetail: [
    {
      foodId: { type: String, default: uuidv4 },
      foodName: { type: String, required: true },
      imgFood: { type: String, required: true },
      foodDesc: { type: String, required: true },
      listImage: { type: Array, required: true },
      linkVideo: { type: Array, default: [] },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  ],
});

const Cuisine = mongoose.model("cuisines", provinceSchema);

export default Cuisine;
