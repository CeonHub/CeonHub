import { env } from "../../config/env";
import { CloudinaryStorageService } from "./cloudinary.storage";
import { LocalStorageService } from "./local.storage";
import type { StorageService } from "./storage.types";

export type { SaveFileInput, StorageService, StoredFile } from "./storage.types";
export { LocalStorageService } from "./local.storage";
export { CloudinaryStorageService } from "./cloudinary.storage";

/**
 * Chooses the driver from STORAGE_DRIVER. Adding S3/R2/Supabase means implementing
 * StorageService in a new file, adding the value to the STORAGE_DRIVER enum in
 * config/env.ts, and adding one branch here.
 */
function createStorage(): StorageService {
  switch (env.STORAGE_DRIVER) {
    case "cloudinary":
      return new CloudinaryStorageService();
    case "local":
      return new LocalStorageService();
  }
}

export const storage: StorageService = createStorage();
