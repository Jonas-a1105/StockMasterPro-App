import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly authService: AuthService) {}

  onModuleInit() {
    this.timer = setInterval(async () => {
      try {
        const count = await this.authService.cleanupExpiredTokens();
        if (count > 0) {
          this.logger.log(`Limpieza automática: ${count} refresh tokens expirados eliminados`);
        }
      } catch (err) {
        this.logger.error('Error en limpieza de refresh tokens', err);
      }
    }, CLEANUP_INTERVAL_MS);

    this.logger.log(`RefreshTokenCleanupService iniciado (cada ${CLEANUP_INTERVAL_MS / 60000} min)`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
