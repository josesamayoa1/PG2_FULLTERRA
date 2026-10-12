import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { IndicatorsModule } from '../indicators/indicators.module';

@Module({
  imports: [
    IndicatorsModule,
  ],
  controllers: [
    DashboardController,
  ],
  providers: [
    DashboardService,
  ],
})
export class DashboardModule {}