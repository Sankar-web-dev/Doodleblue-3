import { diskStorage } from 'multer';
import fs from 'fs';
import path from 'path';
import { ApiException } from './api-error.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', 'profiles');

export const avatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_ROOT)) {
      fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    }
    cb(null, UPLOAD_ROOT);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

export const avatarFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiException(
        400,
        'INVALID_FILE_TYPE',
        'Only JPEG, PNG, WEBP, and GIF images are allowed',
      ),
      false,
    );
  }
};

export const avatarMulterOptions = {
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
};
