import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import JwtPayload from 'src/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // ham sinh token (accesstoken va refreshToken)
  private async generateTokens(userId: string, username: string) {
    const payload: JwtPayload = { id: userId, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // luu refresh token vao db
  private async saveRefreshToken(userId: string, refreshToken: string) {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });
  }

  // dang ky
  async register(dto: AuthDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (user) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại!');
    }

    const hashPassword = await bcrypt.hash(dto.password, 10);

    const createUser = await this.usersService.createUser(
      dto.username,
      hashPassword,
    );

    const { password, ...result } = createUser;

    return {
      message: 'Đăng ký thành công',
      result,
    };
  }

  // dang nhap
  async login(dto: AuthDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không chính xác!',
      );
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không chính xác!',
      );
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.username,
    );

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
    };
  }

  // lam moi refreshToken
  async funcRefreshToken(refreshTokenParam: string) {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        refreshTokenParam,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      const refreshTokenFromDb = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenParam },
      });

      if (!refreshTokenFromDb) {
        throw new UnauthorizedException('Refresh token không hợp lệ!');
      }

      await this.prisma.refreshToken.delete({
        where: { id: refreshTokenFromDb.id },
      });

      const { accessToken, refreshToken } = await this.generateTokens(
        payload.id,
        payload.username,
      );

      await this.saveRefreshToken(payload.id, refreshToken);

      return {
        message: 'Làm mới token thành công',
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Refresh token không hợp lệ!');
    }
  }

  // dang xuat
  async logout(refreshTokenParam: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshTokenParam },
    });

    return {
      message: 'Đăng xuất thành công',
    };
  }
}
