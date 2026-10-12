import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { FuelService } from './fuel.service';
import { CreateFuelLoadDto } from './dto/create-fuel-load.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('fuel')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  'Administrador',
  'Supervisor',
  'Encargado de combustible',
)
export class FuelController {
  constructor(
    private readonly fuelService: FuelService,
  ) {}

  @Post()
  registrarCarga(
    @Body()
    createFuelLoadDto: CreateFuelLoadDto,
    @Req()
    request: {
      user: {
        id: number;
      };
    },
  ) {
    return this.fuelService.registrarCarga(
      createFuelLoadDto,
      request.user.id,
    );
  }

  @Get()
  obtenerCargas() {
    return this.fuelService.obtenerCargas();
  }
}