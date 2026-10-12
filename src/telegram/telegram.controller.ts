import {
  Controller,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TelegramService } from './telegram.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('telegram')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
@Roles(
  'Administrador',
  'Supervisor',
  'Encargado de mantenimiento',
)
export class TelegramController {
  constructor(
    private readonly telegramService:
      TelegramService,
  ) {}

  @Post('maintenance-alerts')
  enviarAlertasMantenimiento(
    @Query('diasAnticipacion')
    diasAnticipacion?: string,

    @Query('fechaReferencia')
    fechaReferencia?: string,
  ) {
    return this.telegramService
      .enviarAlertasMantenimiento(
        diasAnticipacion === undefined
          ? 30
          : Number(diasAnticipacion),
        fechaReferencia,
      );
  }
}