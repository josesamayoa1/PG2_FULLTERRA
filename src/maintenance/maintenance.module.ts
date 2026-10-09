import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Maintenance } from './entities/maintenance.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { Unit } from '../units/entities/unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Maintenance,
      Unit,
    ]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}