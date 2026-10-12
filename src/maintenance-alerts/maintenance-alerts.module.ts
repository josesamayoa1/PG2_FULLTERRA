import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MaintenanceAlertsController } from './maintenance-alerts.controller';
import { MaintenanceAlertsService } from './maintenance-alerts.service';
import { Maintenance } from '../maintenance/entities/maintenance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Maintenance,
    ]),
  ],
  controllers: [
    MaintenanceAlertsController,
  ],
  providers: [
    MaintenanceAlertsService,
  ],
  exports: [
    MaintenanceAlertsService,
  ],
})
export class MaintenanceAlertsModule {}