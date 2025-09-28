import { Controller, Get, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ResponseMessage } from '@common/decorators/customize.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Get("list-role")
  @ResponseMessage("Get list role")
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('get-role/:id')
  @ResponseMessage("Get a role")
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.rolesService.findOne(id);
  }
}