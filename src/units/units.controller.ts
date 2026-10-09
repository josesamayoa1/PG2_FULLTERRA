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
@Roles('Administrador')
export class UnitsController {
  constructor(
    private readonly unitsService: UnitsService,
  ) {}

  @Post()
  crear(
    @Body() createUnitDto: CreateUnitDto,
  ) {
    return this.unitsService.crear(
      createUnitDto,
    );
  }

  @Get()
  obtenerTodos() {
    return this.unitsService.obtenerTodos();
  }

  @Get('tipo/:tipo')
  obtenerPorTipo(
    @Param('tipo') tipo: string,
  ) {
    return this.unitsService.obtenerPorTipo(
      tipo,
    );
  }

  @Patch(':id')
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