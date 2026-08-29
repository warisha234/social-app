import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|webm|mp3|wav|ogg|m4a/;

  const ext = allowed.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mime =
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/");

  if (ext && mime) return cb(null, true);

  cb(new Error("Only image, video or audio files are allowed"));
}

export default multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});
