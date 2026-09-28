import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // tim user theo username -> return user neu co, nguoc lai return null
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // tim user theo id
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // tao nguoi dung
  async createUser(username: string, password: string): Promise<User> {
    return this.prisma.user.create({
      data: { username, password },
    });
  }
}
