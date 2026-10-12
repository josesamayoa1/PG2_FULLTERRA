import { Module } from '@nestjs/common';

import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramSchedulerService } from './telegram-scheduler.service';
import { MaintenanceAlertsModule } from '../maintenance-alerts/maintenance-alerts.module';

@Module({
  imports: [
    MaintenanceAlertsModule,
  ],
  controllers: [
    TelegramController,
  ],
  providers: [
    TelegramService,
    TelegramSchedulerService,
  ],
  exports: [
    TelegramService,
  ],
})
export class TelegramModule {}