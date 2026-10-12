import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './traceability.service';
import { AssetOperation } from '../asset-operations/entities/asset-operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetOperation,
    ]),
  ],
  controllers: [TraceabilityController],
  providers: [TraceabilityService],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}