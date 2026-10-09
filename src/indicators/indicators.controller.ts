import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { IndicatorsService } from './indicators.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('indicators')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class IndicatorsController {
  constructor(
    private readonly indicatorsService:
      IndicatorsService,
  ) {}

  @Get()
  @Roles(
    'Administrador',
    'Supervisor',
  )
  obtenerIndicadores(
    @Query('anio') anio: string,
    @Query('mes') mes: string,
  ) {
    return this.indicatorsService
      .obtenerIndicadores(
        Number(anio),
        Number(mes),
      );
  }

  @Get('monthly-comparison')
  @Roles(
    'Administrador',
    'Supervisor',
  )
  obtenerComparativoMensual(
    @Query('anio') anio: string,
    @Query('mes') mes: string,
  ) {
    return this.indicatorsService
      .obtenerComparativoMensual(
        Number(anio),
        Number(mes),
      );
  }
}