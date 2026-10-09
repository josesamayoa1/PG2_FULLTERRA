import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { EmployeesModule } from './employees/employees.module';
import { UnitsModule } from './units/units.module';
import { ActivityTypesModule } from './activity-types/activity-types.module';
import { AssetOperationsModule } from './asset-operations/asset-operations.module';
import { FuelModule } from './fuel/fuel.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { UnitHistoryModule } from './unit-history/unit-history.module';
import { TraceabilityModule } from './traceability/traceability.module';
import { IndicatorsModule } from './indicators/indicators.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(
          configService.getOrThrow<string>('DB_PORT'),
        ),
        username:
          configService.getOrThrow<string>(
            'DB_USERNAME',
          ),
        password:
          configService.get<string>('DB_PASSWORD') ?? '',
        database:
          configService.getOrThrow<string>(
            'DB_DATABASE',
          ),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    UsersModule,
    AuthModule,
    RolesModule,
    EmployeesModule,
    UnitsModule,
    ActivityTypesModule,
    AssetOperationsModule,
    FuelModule,
    MaintenanceModule,
    UnitHistoryModule,
    TraceabilityModule,
    IndicatorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}