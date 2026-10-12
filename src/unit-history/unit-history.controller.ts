import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UnitHistoryService } from './unit-history.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('units')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  'Administrador',
  'Supervisor',
  'Operador',
  'Encargado de combustible',
  'Encargado de mantenimiento',
)
export class UnitHistoryController {
  constructor(
    private readonly unitHistoryService:
      UnitHistoryService,
  ) {}

  @Get(':id/history')
  obtenerHistorial(
    @Param('id', ParseIntPipe)
    unidadId: number,
  ) {
    return this.unitHistoryService.obtenerHistorial(
      unidadId,
    );
  }
}