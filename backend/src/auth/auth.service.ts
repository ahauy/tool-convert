import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

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

    const accessToken = await this.jwtService.signAsync(
      { id: user.id },
      { secret: process.env.JWT_SECRET },
    );

    return {
      message: 'Đăng nhập thành công',
      accessToken,
    };
  }
}
