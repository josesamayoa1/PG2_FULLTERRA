import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { MaintenanceAlertsService } from './maintenance-alerts.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('maintenance-alerts')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
@Roles(
  'Administrador',
  'Supervisor',
  'Encargado de mantenimiento',
)
export class MaintenanceAlertsController {
  constructor(
    private readonly maintenanceAlertsService:
      MaintenanceAlertsService,
  ) {}

  @Get()
  obtenerAlertas(
    @Query('diasAnticipacion')
    diasAnticipacion?: string,

    @Query('fechaReferencia')
    fechaReferencia?: string,
  ) {
    return this.maintenanceAlertsService
      .obtenerAlertas(
        diasAnticipacion === undefined
          ? 30
          : Number(diasAnticipacion),
        fechaReferencia,
      );
  }
}