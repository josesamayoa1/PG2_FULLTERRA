import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesService } from './roles.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('Administrador')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  crear(
    @Body()
    body: {
      nombre: string;
      descripcion?: string;
    },
  ) {
    return this.rolesService.crear(
      body.nombre,
      body.descripcion,
    );
  }

  @Get()
  obtenerTodos() {
    return this.rolesService.obtenerTodos();
  }
}