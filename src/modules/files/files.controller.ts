import { Controller, Get, Param, Inject } from '@nestjs/common';
import { IFilesService, FileType } from './interfaces/files.service.interface';
import { ApiResponse } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


@Controller('files')
export class FilesController {
  constructor(
    @Inject(IFilesService)
    private readonly filesService: IFilesService,
  ) {}

  @Get(':type/:id')
  async getFile(
    @Param('type') type: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId?: string,
    @CurrentUser('role') userRole?: string,
  ): Promise<ApiResponse> {
    const result = await this.filesService.getPresignedUrl(
      type as FileType,
      id,
      userId,
      userRole,
    );
    return new ApiResponse('File fetched successfully', result);
  }
}
