import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { IUsersRepository } from './interfaces/users.repository.interface';
import { IUsersService } from './interfaces/users.service.interface';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: IUsersRepository,
      useClass: UsersRepository,
    },
    {
      provide: IUsersService,
      useClass: UsersService,
    },
  ],
  exports: [IUsersService],
})
export class UsersModule {}
