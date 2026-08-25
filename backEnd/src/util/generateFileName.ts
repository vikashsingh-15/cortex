
import crypto from "crypto";


export const generateFileName = (fileName: string) => {
  const timestamp = Date.now();
  const ext = fileName.substring(fileName.lastIndexOf("."));
  const baseName = fileName
    .substring(0, fileName.lastIndexOf("."))
    .toLowerCase()
    .replace(/\s+/g, "");

  return `${baseName}-${timestamp}${ext}`;
};



export function generateUniqueFileName(prefix = "doc", extension = "txt"): string {
  const timestamp = Date.now(); // current timestamp in ms
  const randomStr = crypto.randomBytes(3).toString("hex"); // random 6-character hex string
  return `${prefix}-${timestamp}-${randomStr}.${extension}`;
}
