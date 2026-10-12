import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

type AuthenticatedRequest = {
  user: { id: number; usuario: string; roles: string[] };
};

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('Administrador')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  obtenerTodos() {
    return this.usersService.obtenerTodos();
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.actualizar(id, updateUserDto);
  }

  @Patch(':id/roles')
  asignarRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roles: number[] },
    @Req() request: AuthenticatedRequest,
  ) {
    if (id === request.user.id) {
      throw new BadRequestException(
        'No puedes modificar los roles de tu propia cuenta',
      );
    }
    return this.usersService.asignarRoles(id, body.roles);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { activo: boolean },
    @Req() request: AuthenticatedRequest,
  ) {
    if (id === request.user.id && body.activo === false) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta',
      );
    }
    return this.usersService.cambiarEstado(id, body.activo);
  }
}
