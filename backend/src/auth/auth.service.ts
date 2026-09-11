import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { User, UserTier, SubscriptionStatus } from '../users/user.entity.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ user: Omit<User, 'passwordHash'>; accessToken: string }> {
    const existing = await this.usersService.findByEmail(signupDto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(signupDto.password, salt);

    const newUser = await this.usersService.create({
      email: signupDto.email,
      passwordHash,
      name: signupDto.name?.trim() || null,
      tier: UserTier.FREE,
      subscriptionStatus: SubscriptionStatus.INACTIVE,
    });

    const accessToken = this.generateToken(newUser);

    return {
      user: this.usersService.sanitizeUser(newUser),
      accessToken,
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: Omit<User, 'passwordHash'>; accessToken: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.generateToken(user);

    return {
      user: this.usersService.sanitizeUser(user),
      accessToken,
    };
  }

  generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      tier: user.tier,
    };
    return this.jwtService.sign(payload);
  }
}
