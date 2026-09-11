import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;

  @IsString({ message: 'Password must be provided' })
  password: string;
}
