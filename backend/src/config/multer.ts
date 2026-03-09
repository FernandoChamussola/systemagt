import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';

// Criar diretório de uploads se não existir
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const hash = randomBytes(16).toString('hex');
    const filename = `${hash}-${file.originalname}`;
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Imagens padrão
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Formatos modernos (iPhone, Samsung, etc.) - serão convertidos para JPEG
    'image/heic',
    'image/heif',
    'image/avif',
    'image/tiff',
    'image/bmp',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Alguns dispositivos enviam HEIC com mimetype genérico ou incorreto
  // Verificar também pela extensão do arquivo
  const ext = file.originalname.toLowerCase().split('.').pop();
  const heicExtensions = ['heic', 'heif'];

  if (allowedMimes.includes(file.mimetype) || (ext && heicExtensions.includes(ext))) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Formatos aceitos: JPEG, PNG, GIF, WEBP, HEIC, HEIF, PDF, DOC, DOCX'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
