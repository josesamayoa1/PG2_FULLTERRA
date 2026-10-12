import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('maintenance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  'Administrador',
  'Supervisor',
  'Encargado de mantenimiento',
)
export class MaintenanceController {
  constructor(
    private readonly maintenanceService:
      MaintenanceService,
  ) {}

  @Post()
  registrar(
    @Body()
    createMaintenanceDto:
      CreateMaintenanceDto,
  ) {
    return this.maintenanceService.registrar(
      createMaintenanceDto,
    );
  }

  @Get()
  obtenerTodos() {
    return this.maintenanceService.obtenerTodos();
  }
}