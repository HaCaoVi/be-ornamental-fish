import { Controller, Get, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ResponseMessage } from '@common/decorators/customize.decorator';
import { Types } from 'mongoose';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('list-role')
  @ResponseMessage('Get list role')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('get-role/:id')
  @ResponseMessage('Get a role')
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.rolesService.findOne(id);
  }
}
