import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://trungduong0810:123@cluster0.axljgul.mongodb.net/doantotnghiep"
    );
    console.log("kết nối thành công");
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
