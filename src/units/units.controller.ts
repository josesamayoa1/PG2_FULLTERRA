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

import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('units')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UnitsController {
  constructor(
    private readonly unitsService: UnitsService,
  ) {}

  @Post()
  @Roles('Administrador')
  crear(
    @Body() createUnitDto: CreateUnitDto,
  ) {
    return this.unitsService.crear(
      createUnitDto,
    );
  }

  @Get()
  @Roles(
    'Administrador',
    'Supervisor',
    'Operador',
  )
  obtenerTodos() {
    return this.unitsService.obtenerTodos();
  }

  @Get('tipo/:tipo')
  @Roles(
    'Administrador',
    'Supervisor',
    'Operador',
  )
  obtenerPorTipo(
    @Param('tipo') tipo: string,
  ) {
    return this.unitsService.obtenerPorTipo(
      tipo,
    );
  }

  @Patch(':id')
  @Roles('Administrador')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.actualizar(
      id,
      updateUnitDto,
    );
  }

  @Patch(':id/activo')
  @Roles('Administrador')
  cambiarEstadoActivo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { activo: boolean },
  ) {
    return this.unitsService.cambiarEstadoActivo(
      id,
      body.activo,
    );
  }
}