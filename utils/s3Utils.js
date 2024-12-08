import AWS from "aws-sdk";

// Cấu hình AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * Hàm tạo pre-signed URLs
 * @param {Array} files Danh sách file (name, type)
 * @param {String} folderName Tên thư mục trong bucket (optional)
 * @param {Number} expires Thời gian hết hạn của URL (seconds)
 * @returns {Promise<Array>} Danh sách URLs
 */
export const generatePresignedUrls = async (
  files,
  folderName = "uploads",
  expires = 60
) => {
  if (!Array.isArray(files)) {
    throw new Error("Files must be an array.");
  }

  const presignedUrls = await Promise.all(
    files.map((file) => {
      // Tạo đường dẫn đầy đủ trong bucket
      const key = `${folderName}/${Date.now()}-${file.name}`; // Thêm timestamp để tránh trùng lặp tên file

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key, // Đường dẫn trong bucket
        Expires: expires,
        ContentType: file.type,
      };

      return s3.getSignedUrlPromise("putObject", params).then((url) => ({
        url, // Pre-signed URL
        key, // Đường dẫn đầy đủ để lưu vào database
      }));
    })
  );

  return presignedUrls;
};
