import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetOperation } from './entities/asset-operation.entity';
import { Unit } from '../units/entities/unit.entity';
import { Employee } from '../employees/entities/employee.entity';
import { ActivityType } from '../activity-types/entities/activity-type.entity';
import { AssetOperationsService } from './asset-operations.service';
import { AssetOperationsController } from './asset-operations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetOperation,
      Unit,
      Employee,
      ActivityType,
    ]),
  ],
  controllers: [AssetOperationsController],
  providers: [AssetOperationsService],
  exports: [AssetOperationsService],
})
export class AssetOperationsModule {}