import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Formatos que precisam ser convertidos para JPEG
const CONVERT_FORMATS = [
  'image/heic',
  'image/heif',
  'image/avif',
  'image/tiff',
  'image/bmp',
];

// Formatos de imagem suportados (não precisam conversão)
const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

export function isImageFile(mimetype: string): boolean {
  return (
    SUPPORTED_IMAGE_FORMATS.includes(mimetype) ||
    CONVERT_FORMATS.includes(mimetype)
  );
}

export function needsConversion(mimetype: string): boolean {
  return CONVERT_FORMATS.includes(mimetype);
}

interface ProcessedImage {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  originalName: string;
}

/**
 * Processa uma imagem, convertendo formatos incompatíveis (HEIC, HEIF, etc.) para JPEG
 * Também otimiza a qualidade para reduzir tamanho do arquivo
 */
export async function processImage(
  inputPath: string,
  outputDir: string,
  originalFilename: string,
  originalMimetype: string
): Promise<ProcessedImage> {
  // Se não precisa conversão, retorna os dados originais
  if (!needsConversion(originalMimetype)) {
    const stats = fs.statSync(inputPath);
    return {
      filename: path.basename(inputPath),
      path: inputPath,
      mimetype: originalMimetype,
      size: stats.size,
      originalName: originalFilename,
    };
  }

  // Gerar novo nome de arquivo com extensão .jpg
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const newFilename = `${baseName}.jpg`;
  const outputPath = path.join(outputDir, newFilename);

  // Converter para JPEG usando sharp
  await sharp(inputPath)
    .jpeg({
      quality: 85, // Boa qualidade com tamanho razoável
      mozjpeg: true, // Usar mozjpeg para melhor compressão
    })
    .toFile(outputPath);

  // Obter tamanho do novo arquivo
  const stats = fs.statSync(outputPath);

  // Remover arquivo original (HEIC/HEIF)
  if (inputPath !== outputPath) {
    fs.unlinkSync(inputPath);
  }

  // Atualizar nome original para ter extensão .jpg
  const originalBaseName = path.basename(
    originalFilename,
    path.extname(originalFilename)
  );
  const newOriginalName = `${originalBaseName}.jpg`;

  return {
    filename: newFilename,
    path: outputPath,
    mimetype: 'image/jpeg',
    size: stats.size,
    originalName: newOriginalName,
  };
}

/**
 * Otimiza imagens existentes (redimensiona se muito grandes)
 * Útil para reduzir uso de armazenamento
 */
export async function optimizeImage(
  inputPath: string,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): Promise<void> {
  const metadata = await sharp(inputPath).metadata();

  // Se a imagem já é menor que o máximo, não faz nada
  if (
    metadata.width &&
    metadata.height &&
    metadata.width <= maxWidth &&
    metadata.height <= maxHeight
  ) {
    return;
  }

  const tempPath = `${inputPath}.temp`;

  await sharp(inputPath)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFile(tempPath);

  // Substituir arquivo original
  fs.unlinkSync(inputPath);
  fs.renameSync(tempPath, inputPath);
}
