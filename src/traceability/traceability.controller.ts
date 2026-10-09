import {
  Controller,
  Get,
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
  obtenerTrazabilidad() {
    return this.traceabilityService.obtenerTrazabilidad();
  }
}