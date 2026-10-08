import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Administrador')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Administrador')
  @Get()
  obtenerTodos() {
    return this.usersService.obtenerTodos();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Administrador')
  @Patch(':id/roles')
  asignarRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roles: number[] },
  ) {
    return this.usersService.asignarRoles(id, body.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Administrador')
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { activo: boolean },
  ) {
    return this.usersService.cambiarEstado(id, body.activo);
  }
}