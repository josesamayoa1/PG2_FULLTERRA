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

import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('employees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('Administrador')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
  ) {}

  @Post()
  crear(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.crear(
      createEmployeeDto,
    );
  }

  @Get()
  obtenerTodos() {
    return this.employeesService.obtenerTodos();
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.actualizar(
      id,
      updateEmployeeDto,
    );
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { activo: boolean },
  ) {
    return this.employeesService.cambiarEstado(
      id,
      body.activo,
    );
  }
}