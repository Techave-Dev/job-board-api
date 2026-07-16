import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException({
        code: 'file.required',
        message: 'File is required',
      });
    }

    if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'file.invalid_type',
        message: `Allowed file types: ${this.options.allowedMimeTypes.join(', ')}`,
      });
    }

    if (file.size > this.options.maxSizeBytes) {
      throw new BadRequestException({
        code: 'file.too_large',
        message: `File size must not exceed ${this.options.maxSizeBytes / (1024 * 1024)}MB`,
      });
    }

    return file;
  }
}
