import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must not exceed 72 characters' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
