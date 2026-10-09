import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivityType } from './entities/activity-type.entity';
import { ActivityTypesService } from './activity-types.service';
import { ActivityTypesController } from './activity-types.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityType,
    ]),
  ],
  controllers: [ActivityTypesController],
  providers: [ActivityTypesService],
  exports: [ActivityTypesService],
})
export class ActivityTypesModule {}