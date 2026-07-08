import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req, Headers } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@shared/infrastructure/decorators/public.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthService } from '../auth.service';
import { RegisterTenantDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterTenantDto, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.register({ ...dto, ipAddress, userAgent });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login({ ...dto, ipAddress, userAgent });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(dto.refreshToken, dto.deviceId, userAgent, ipAddress);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout/all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: any) {
    return this.authService.logoutAll(user.id);
  }

  @Post('logout/device')
  @HttpCode(HttpStatus.OK)
  async logoutDevice(@CurrentUser() user: any, @Body() dto: { deviceId: string }) {
    return this.authService.logoutDevice(user.id, dto.deviceId);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async listSessions(@CurrentUser() user: any) {
    return this.authService.listSessions(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}

