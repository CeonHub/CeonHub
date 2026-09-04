import { randomUUID } from "node:crypto";
import path from "node:path";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { cloudinaryConfig } from "../../config/env";
import { slugify } from "../../utils/slug";
import type { SaveFileInput, StorageService, StoredFile } from "./storage.types";

/**
 * Object-storage driver backed by Cloudinary. Nothing but the resulting URL and the
 * public id reach the database, so the API can run on ephemeral filesystems (Render,
 * Railway, Fly) where anything written to disk disappears on the next deploy.
 *
 * Resumes are uploaded as `raw` rather than `image`: raw keeps the bytes untouched,
 * skips image processing, and is unaffected by the "PDF and ZIP files delivery"
 * account setting that otherwise blocks PDFs served as images.
 */
export class CloudinaryStorageService implements StorageService {
  constructor() {
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
      secure: true,
    });
  }

  async save({ buffer, fileName, mimeType, folder }: SaveFileInput): Promise<StoredFile> {
    const publicId = this.buildPublicId(fileName, folder);
    const uploaded = await this.upload(buffer, publicId);

    return {
      // For raw resources the public id carries the extension, and it is what
      // delete() needs later, so it is the key we persist.
      key: uploaded.public_id,
      url: uploaded.secure_url,
      fileName,
      mimeType,
      size: uploaded.bytes ?? buffer.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(key, {
      resource_type: "raw",
      invalidate: true,
    });

    // Cloudinary answers "not found" instead of throwing when the asset is already
    // gone; that is not a reason to fail the request that triggered the cleanup.
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary refused to delete ${key}: ${result.result}`);
    }
  }

  urlFor(key: string): string {
    // analytics:false keeps the SDK from appending its ?_a= tracking parameter.
    return cloudinary.url(key, { resource_type: "raw", secure: true, analytics: false });
  }

  /**
   * `<base>/<folder>/<uuid>-<name><ext>`. The uuid keeps two people uploading
   * "cv.pdf" from colliding, and the readable tail keeps the download filename
   * meaningful, since browsers name the file after the last URL segment.
   */
  private buildPublicId(fileName: string, folder: string): string {
    const extension = path.extname(fileName).toLowerCase().slice(0, 10);
    const base = slugify(path.basename(fileName, path.extname(fileName))) || "file";
    const safeFolder = slugify(folder) || "files";

    return [cloudinaryConfig.folder, safeFolder, `${randomUUID()}-${base}${extension}`]
      .filter(Boolean)
      .join("/");
  }

  private upload(buffer: Buffer, publicId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: publicId,
          // The public id is already unique and fully qualified; let neither
          // Cloudinary nor a retry rewrite or clobber it.
          use_filename: false,
          unique_filename: false,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
            return;
          }
          if (!result) {
            reject(new Error("Cloudinary upload returned no result"));
            return;
          }
          resolve(result);
        },
      );

      stream.end(buffer);
    });
  }
}
