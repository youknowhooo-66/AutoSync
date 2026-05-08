import multer from 'multer';

const storage = multer.memoryStorage(); // Store file in memory

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos XLSX e CSV são permitidos!'));
    }
  },
});
