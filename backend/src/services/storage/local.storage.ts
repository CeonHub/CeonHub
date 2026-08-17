import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";
import { slugify } from "../../utils/slug";
import type { SaveFileInput, StorageService, StoredFile } from "./storage.types";

/**
 * Development / single-server driver: files live under STORAGE_LOCAL_DIR and are
 * served by the API at /uploads. Containers must mount that directory as a volume,
 * otherwise uploads disappear on redeploy — which is why production should use an
 * object-storage driver (docs/architecture.md, "Storage").
 */
export class LocalStorageService implements StorageService {
  private readonly root: string;

  constructor(root: string = path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR)) {
    this.root = root;
  }

  async save({ buffer, fileName, mimeType, folder }: SaveFileInput): Promise<StoredFile> {
    const safeFolder = slugify(folder) || "files";
    const extension = path.extname(fileName).toLowerCase().slice(0, 10);
    const base = slugify(path.basename(fileName, path.extname(fileName))) || "file";
    const key = `${safeFolder}/${randomUUID()}-${base}${extension}`;

    const target = this.resolveKey(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);

    return { key, url: this.urlFor(key), fileName, mimeType, size: buffer.byteLength };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch (error) {
      // Deleting an already-missing file is not an error worth failing a request for.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  urlFor(key: string): string {
    return `${env.API_URL}/uploads/${key}`;
  }

  /** The directory the API serves /uploads from. */
  get directory(): string {
    return this.root;
  }

  /** Guards against "../" in a stored key escaping the storage directory. */
  private resolveKey(key: string): string {
    const target = path.resolve(this.root, key);
    if (target !== this.root && !target.startsWith(this.root + path.sep)) {
      throw new Error(`Refusing to access a file outside the storage directory: ${key}`);
    }
    return target;
  }
}
