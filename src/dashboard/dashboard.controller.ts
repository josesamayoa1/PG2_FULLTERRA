import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('dashboard')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class DashboardController {
  constructor(
    private readonly dashboardService:
      DashboardService,
  ) {}

  @Get()
  @Roles(
    'Administrador',
    'Supervisor',
  )
  obtenerDashboard(
    @Query('anio') anio: string,
    @Query('mes') mes: string,
    @Query('dia') dia?: string,
  ) {
    return this.dashboardService
      .obtenerDashboard(
        Number(anio),
        Number(mes),
        dia === undefined
          ? undefined
          : Number(dia),
      );
  }
}