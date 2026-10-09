import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UnitHistoryController } from './unit-history.controller';
import { UnitHistoryService } from './unit-history.service';
import { Unit } from '../units/entities/unit.entity';
import { AssetOperation } from '../asset-operations/entities/asset-operation.entity';
import { FuelLoad } from '../fuel/entities/fuel-load.entity';
import { Maintenance } from '../maintenance/entities/maintenance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Unit,
      AssetOperation,
      FuelLoad,
      Maintenance,
    ]),
  ],
  controllers: [UnitHistoryController],
  providers: [UnitHistoryService],
  exports: [UnitHistoryService],
})
export class UnitHistoryModule {}