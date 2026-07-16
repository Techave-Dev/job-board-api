import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { IStorageService } from './interfaces/storage.service.interface';

@Global()
@Module({
  providers: [
    StorageService,
    {
      provide: IStorageService,
      useClass: StorageService,
    },
  ],
  exports: [IStorageService],
})
export class StorageModule {}
