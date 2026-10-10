import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramSchedulerService {
  private readonly logger =
    new Logger(
      TelegramSchedulerService.name,
    );

  constructor(
    private readonly configService:
      ConfigService,

    private readonly telegramService:
      TelegramService,
  ) {}

  @Cron(
    '0 0 8 * * *',
    {
      timeZone:
        'America/Guatemala',
    },
  )
  async enviarAlertasDiarias() {
    const notificacionesHabilitadas =
      this.configService.get<string>(
        'TELEGRAM_NOTIFICATIONS_ENABLED',
      ) === 'true';

    if (
      !notificacionesHabilitadas
    ) {
      return;
    }

    const diasAnticipacion =
      Number(
        this.configService.get<string>(
          'TELEGRAM_ALERT_DAYS',
        ) ?? '30',
      );

    try {
      const resultado =
        await this.telegramService
          .enviarAlertasMantenimiento(
            diasAnticipacion,
          );

      this.logger.log(
        `Revisión automática de Telegram completada. Alertas: ${resultado.totalAlertas}`,
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'Error desconocido';

      this.logger.error(
        `Error al ejecutar las alertas automáticas de Telegram: ${mensaje}`,
      );
    }
  }
}