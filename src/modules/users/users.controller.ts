import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

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

  @Get('get-user/:id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('update-user/:id')
  @ResponseMessage("Updated user")
  update(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateRoleDto: UpdateUserDto
  ) {
    return this.usersService.update(user, id, updateRoleDto);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
