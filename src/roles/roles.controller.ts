import { Body, Controller, Get, Post } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
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
    return this.rolesService.crear(body.nombre, body.descripcion);
  }

  @Get()
  obtenerTodos() {
    return this.rolesService.obtenerTodos();
  }
}