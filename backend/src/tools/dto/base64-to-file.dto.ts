import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class Base64ToFileDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(data:[\w/]+;base64,)?[A-Za-z0-9+/]+={0,2}$/, {
    message: 'Base64 không hợp lệ!',
  })
  base64!: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
