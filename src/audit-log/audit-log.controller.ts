import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuditLogService } from './audit-log.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('audit-log')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
@Roles(
  'Administrador',
  'Supervisor',
)
export class AuditLogController {
  constructor(
    private readonly auditLogService:
      AuditLogService,
  ) {}

  @Get()
  obtenerBitacora() {
    return this.auditLogService
      .obtenerBitacora();
  }
}