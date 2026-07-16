export const IStorageService = Symbol('IStorageService');

export interface IStorageService {
  upload(key: string, body: Buffer, mimeType: string): Promise<void>;
  getPresignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
