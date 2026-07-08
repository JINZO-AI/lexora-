import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const STORAGE_DIR = path.join(process.cwd(), "storage", "contracts");

export async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

export async function saveContractFile(
  userId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ filePath: string; fileHash: string; fileSize: number }> {
  await ensureStorageDir();

  // Generate SHA256 hash for duplicate detection
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Build path: {userId}/{year}/{month}/{hash-prefix}_{originalname}
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hashPrefix = fileHash.substring(0, 8);

  const ext = path.extname(fileName).toLowerCase();
  const safeName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 50);
  const storedFileName = `${safeName}_${hashPrefix}${ext}`;

  const relDir = path.join(userId, String(year), month);
  const absDir = path.join(STORAGE_DIR, relDir);
  await fs.mkdir(absDir, { recursive: true });

  const absPath = path.join(absDir, storedFileName);
  const relPath = path.join(relDir, storedFileName);

  await fs.writeFile(absPath, buffer);

  return {
    filePath: relPath,
    fileHash,
    fileSize: buffer.length,
  };
}

export async function readContractFile(filePath: string): Promise<Buffer> {
  const absPath = path.join(STORAGE_DIR, filePath);
  return fs.readFile(absPath);
}

export async function deleteContractFile(filePath: string): Promise<void> {
  try {
    const absPath = path.join(STORAGE_DIR, filePath);
    await fs.unlink(absPath);
  } catch {
    // File may already be deleted, ignore
  }
}

export async function parseContractFile(
  filePath: string,
  mimeType: string
): Promise<{ text: string; pageCount: number; wordCount: number }> {
  const buffer = await readContractFile(filePath);

  let text = "";
  let pageCount = 1;

  try {
    if (mimeType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(buffer);
      text = pdfData.text || "";
      pageCount = pdfData.numpages || 1;
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For DOCX - extract text using a simple approach
      // We'll use the mammoth library if available, otherwise fallback to raw text
      text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " ");
      pageCount = Math.max(1, Math.ceil(text.length / 3000));
    } else if (mimeType === "text/plain") {
      text = buffer.toString("utf-8");
      pageCount = Math.max(1, Math.ceil(text.length / 3000));
    } else {
      // Try as text
      text = buffer.toString("utf-8");
    }
  } catch (error) {
    console.error("File parse error:", error);
    // Fallback: try reading as text
    text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " ");
  }

  // Clean up text
  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { text, pageCount, wordCount };
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function getFileIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("wordprocessingml")) return "docx";
  return "txt";
}
