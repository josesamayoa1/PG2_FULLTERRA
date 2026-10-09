import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TraceabilityService } from './traceability.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('traceability')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  'Administrador',
  'Supervisor',
)
export class TraceabilityController {
  constructor(
    private readonly traceabilityService:
      TraceabilityService,
  ) {}

  @Get()
  obtenerTrazabilidad(
    @Query('unidadId')
    unidadId?: string,

    @Query('empleadoId')
    empleadoId?: string,

    @Query('fecha')
    fecha?: string,

    @Query('fechaInicio')
    fechaInicio?: string,

    @Query('fechaFin')
    fechaFin?: string,
  ) {
    return this.traceabilityService
      .obtenerTrazabilidad({
        unidadId:
          unidadId === undefined
            ? undefined
            : Number(unidadId),

        empleadoId:
          empleadoId === undefined
            ? undefined
            : Number(empleadoId),

        fecha,
        fechaInicio,
        fechaFin,
      });
  }
}