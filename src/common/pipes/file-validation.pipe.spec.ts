import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

describe('FileValidationPipe', () => {
  const options = {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  };

  it('should throw BadRequestException when no file provided', () => {
    const pipe = new FileValidationPipe(options);

    expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException with file.required code', () => {
    const pipe = new FileValidationPipe(options);

    try {
      pipe.transform(null as any);
    } catch (error) {
      const response = (error as BadRequestException).getResponse();
      expect(response).toEqual(
        expect.objectContaining({ code: 'file.required' }),
      );
    }
  });

  it('should throw BadRequestException when invalid MIME type', () => {
    const pipe = new FileValidationPipe(options);
    const file = {
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    try {
      pipe.transform(file);
    } catch (error) {
      const response = (error as BadRequestException).getResponse();
      expect(response).toEqual(
        expect.objectContaining({ code: 'file.invalid_type' }),
      );
    }
  });

  it('should throw BadRequestException when file too large', () => {
    const pipe = new FileValidationPipe(options);
    const file = {
      mimetype: 'image/jpeg',
      size: 10 * 1024 * 1024,
    } as Express.Multer.File;

    try {
      pipe.transform(file);
    } catch (error) {
      const response = (error as BadRequestException).getResponse();
      expect(response).toEqual(
        expect.objectContaining({ code: 'file.too_large' }),
      );
    }
  });

  it('should return file when valid', () => {
    const pipe = new FileValidationPipe(options);
    const file = {
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    const result = pipe.transform(file);

    expect(result).toEqual(file);
  });
});
