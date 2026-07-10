import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LicensesService } from '../licenses.service';
import { StripeService } from '../stripe.service';
import { GenerateLicenseDto } from '../../dto/generate-license.dto';
import { ActivateLicenseDto } from '../../dto/activate-license.dto';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { PlatformAdminGuard } from '@shared/infrastructure/guards/platform-admin.guard';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { SkipLicenseCheck } from '@shared/infrastructure/decorators/skip-license-check.decorator';

@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly licensesService: LicensesService,
    private readonly stripeService: StripeService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @SkipLicenseCheck()
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    if (!user?.tenantId) throw new UnauthorizedException();
    return this.licensesService.getStatus(user.tenantId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @SkipLicenseCheck()
  async getUsage(@CurrentUser() user: AuthenticatedUser) {
    if (!user?.tenantId) throw new UnauthorizedException();
    return this.licensesService.getUsageStats(user.tenantId);
  }

  @Post('create-subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @SkipLicenseCheck()
  async createSubscription(
    @Body() body: { planType: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user?.tenantId) throw new UnauthorizedException();
    const validPlans = ['pro', 'enterprise'];
    if (!validPlans.includes(body.planType)) {
      throw new HttpException('Plan inválido', HttpStatus.BAD_REQUEST);
    }
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/settings?tab=licenses`;
    return this.stripeService.createSubscription(
      user.tenantId,
      body.planType,
      returnUrl,
    );
  }

  @Post('customer-portal')
  @UseGuards(JwtAuthGuard)
  @SkipLicenseCheck()
  async portal(@CurrentUser() user: AuthenticatedUser) {
    if (!user?.tenantId) throw new UnauthorizedException();
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/settings?tab=licenses`;
    return this.stripeService.createPortalSession(user.tenantId, returnUrl);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async upgradePlan(
    @Body() body: { planType: string; tenantId: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const targetTenantId = body.tenantId || user.tenantId;
    if (!targetTenantId) throw new UnauthorizedException();
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(body.planType)) {
      throw new HttpException('Plan inválido', HttpStatus.BAD_REQUEST);
    }
    return this.licensesService.upgradePlan(targetTenantId, body.planType);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async generate(
    @Body() dto: GenerateLicenseDto,
  ) {
    return this.licensesService.generate({
      days: dto.days,
      tier: dto.tier,
      targetTenantId: dto.targetTenantId,
    });
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  @SkipLicenseCheck()
  async activate(
    @Body() dto: ActivateLicenseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user?.tenantId) throw new UnauthorizedException();
    return this.licensesService.activate(dto.code, user.tenantId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @SkipLicenseCheck()
  async cancel(@CurrentUser() user: AuthenticatedUser) {
    if (!user?.tenantId) throw new UnauthorizedException();
    return this.stripeService.cancelSubscription(user.tenantId);
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async reactivate(@Body() body: { tenantId: string }) {
    if (!body.tenantId) throw new UnauthorizedException();
    return this.licensesService.reactivate(body.tenantId);
  }
}
