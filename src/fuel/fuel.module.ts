import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FuelLoad } from './entities/fuel-load.entity';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';
import { Unit } from '../units/entities/unit.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FuelLoad,
      Unit,
      User,
    ]),
  ],
  controllers: [FuelController],
  providers: [FuelService],
  exports: [FuelService],
})
export class FuelModule {}