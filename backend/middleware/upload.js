import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gramline",
    resource_type: "auto",
  },
});

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|webm|mp3|wav|ogg|m4a/;
  const ext = allowed.test(file.originalname.toLowerCase());

  const mime =
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/");

  if (ext && mime) return cb(null, true);

  cb(new Error("Only image, video or audio files are allowed"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

export default upload;