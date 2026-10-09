import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AssetOperationsService } from './asset-operations.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { CreateMachineryHoursDto } from './dto/create-machinery-hours.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('asset-operations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  'Administrador',
  'Supervisor',
  'Operador',
)
export class AssetOperationsController {
  constructor(
    private readonly assetOperationsService:
      AssetOperationsService,
  ) {}

  @Post('trips')
  registrarViaje(
    @Body() createTripDto: CreateTripDto,
  ) {
    return this.assetOperationsService.registrarViaje(
      createTripDto,
    );
  }

  @Get('trips')
  obtenerViajes() {
    return this.assetOperationsService.obtenerViajes();
  }

  @Post('machinery-hours')
  registrarHorasMaquinaria(
    @Body()
    createMachineryHoursDto:
      CreateMachineryHoursDto,
  ) {
    return this.assetOperationsService.registrarHorasMaquinaria(
      createMachineryHoursDto,
    );
  }

  @Get('machinery-hours')
  obtenerHorasMaquinaria() {
    return this.assetOperationsService.obtenerHorasMaquinaria();
  }
}