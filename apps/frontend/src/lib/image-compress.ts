export interface CompressedImageResult {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

/**
 * Mengompresi dan mengubah ukuran foto makanan di sisi client sebelum dikirim ke server
 * sesuai aturan AGENTS.md Section 4.3 (maxWidthOrHeight: 1280, quality: 0.8).
 */
export async function compressFoodImageClient(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<CompressedImageResult> {
  const maxDimension = options.maxDimension ?? 1280;
  const quality = options.quality ?? 0.82;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak didukung."));
      img.onload = () => {
        let targetWidth = img.naturalWidth || img.width;
        let targetHeight = img.naturalHeight || img.height;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth >= targetHeight) {
            targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
            targetHeight = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi Canvas 2D context."));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let mimeType = "image/webp";
        let dataUrl = canvas.toDataURL(mimeType, quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          mimeType = "image/jpeg";
          dataUrl = canvas.toDataURL(mimeType, quality);
        }

        const base64Part = dataUrl.split(",")[1] ?? "";
        const compressedSizeBytes = Math.round((base64Part.length * 3) / 4);

        resolve({
          dataUrl,
          mimeType,
          width: targetWidth,
          height: targetHeight,
          originalSizeBytes: file.size,
          compressedSizeBytes,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
