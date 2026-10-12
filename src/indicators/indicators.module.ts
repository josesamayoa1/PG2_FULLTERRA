import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IndicatorsController } from './indicators.controller';
import { IndicatorsService } from './indicators.service';
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
  controllers: [IndicatorsController],
  providers: [IndicatorsService],
  exports: [IndicatorsService],
})
export class IndicatorsModule {}