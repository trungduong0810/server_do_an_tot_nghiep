import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
  provinceName: { type: String, required: true },
  provinceSlug: { type: String, required: true },
  itineraryDetail: [
    {
      timeTrip: { type: String, required: true },
      content: { type: String, required: true },
      userCreate: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  ],
});

const itinerary = mongoose.model("itineraries", itinerarySchema);

export default itinerary;
