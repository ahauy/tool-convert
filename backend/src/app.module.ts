import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ToolsController } from './tools/tools.controller';
import { ToolsService } from './tools/tools.service';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, ToolsModule],
  controllers: [AppController, ToolsController],
  providers: [AppService, ToolsService],
})
export class AppModule {}
