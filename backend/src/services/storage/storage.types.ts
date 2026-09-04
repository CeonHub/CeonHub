export interface StoredFile {
  /** Driver-specific identifier, e.g. "resumes/abc123-cv.pdf". Stored in the database. */
  key: string;
  /** Absolute URL a browser can fetch. */
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface SaveFileInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  /** Logical folder, e.g. "resumes". */
  folder: string;
}

/**
 * Everything the application knows about file storage.
 *
 * Business logic depends on this interface only, so adding an S3-compatible driver
 * is a matter of implementing three methods and extending the factory, with no changes
 * to controllers or services. See docs/architecture.md ("Storage").
 */
export interface StorageService {
  save(input: SaveFileInput): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  urlFor(key: string): string;
}
