import { IsString, MinLength } from "class-validator";

export class AuthDto {
  @IsString()
  @MinLength(3, {message: 'Tên đăng nhập phải có ít nhất 3 ký tự!'})
  username: string;

  @IsString()
  @MinLength(6, {message: 'Mật khẩu phải có ít nhất 6 ký tự!'})
  password: string;
}