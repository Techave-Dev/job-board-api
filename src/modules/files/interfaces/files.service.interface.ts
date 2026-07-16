export type FileType = 'resumes' | 'logos' | 'attachments';

export interface FileUrlResult {
  url: string;
}

export const IFilesService = Symbol('IFilesService');

export interface IFilesService {
  getPresignedUrl(
    type: FileType,
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<FileUrlResult>;
}
