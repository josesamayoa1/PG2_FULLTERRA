import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id/roles')
  asignarRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roles: number[] },
  ) {
    return this.usersService.asignarRoles(id, body.roles);
  }
}