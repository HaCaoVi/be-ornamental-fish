import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public, ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post("create-user")
  @ResponseMessage("Created new user")
  create(
    @UserReq() user: IToken,
    @Body() createUserDto: CreateUserDto
  ) {
    return this.usersService.create(user, createUserDto);
  }

  @Get("list-user")
  findAll(
    @Query() query: any
  ) {
    const { current, pageSize, ...filters } = query;
    return this.usersService.findAll(+current, +pageSize, filters);
  }

  @Public()
  @Get('get-user/:id')
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.usersService.findOne(id);
  }

  @Patch('update-user/:id')
  @ResponseMessage("Updated user")
  update(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateRoleDto: UpdateUserDto
  ) {
    return this.usersService.update(user, id, updateRoleDto);
  }

  @Delete('delete-user/:id')
  @ResponseMessage("Deleted user")
  remove(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.usersService.remove(user, id);
  }
}
