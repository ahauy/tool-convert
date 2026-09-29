import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDTO {
  @IsString()
  @IsNotEmpty({ message: "Refresh Token không được để trống !" })
  refreshToken: string;
}