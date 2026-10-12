import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ActivityTypesService } from './activity-types.service';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('activity-types')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ActivityTypesController {
  constructor(
    private readonly activityTypesService:
      ActivityTypesService,
  ) {}

  @Post()
  @Roles('Administrador')
  crear(
    @Body()
    createActivityTypeDto: CreateActivityTypeDto,
  ) {
    return this.activityTypesService.crear(
      createActivityTypeDto,
    );
  }

  @Get()
  @Roles(
    'Administrador',
    'Supervisor',
    'Operador',
  )
  obtenerTodos() {
    return this.activityTypesService.obtenerTodos();
  }
}