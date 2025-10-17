import { Cookies, Public, ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AuthService } from './auth.service';
import type { IToken } from '@common/interfaces/customize.interface';
import { ActiveAccountDto } from './dto/active-account.dto';
import { RegisterUserDto } from './dto/register.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ResponseMessage("Login successfully")
    async login(
        @UserReq() user: IToken,
    ) {
        return this.authService.login(user);
    }

    @Get('account')
    getProfile(
        @UserReq() user: IToken
    ) {
        const { iat, exp, sub, ...data } = user;
        return { _id: sub, ...data };
    }

    @Public()
    @Get('refresh')
    @ResponseMessage("Refresh successfully")
    refreshToken(
        @Cookies('refresh_token') refreshToken: string
    ) {
        return this.authService.refreshToken(refreshToken)
    }

    @Post('logout')
    @ResponseMessage("Logout successfully")
    logout(
        @UserReq() user: IToken
    ) {
        return this.authService.logout(user)
    }

    @Public()
    @Post('register')
    @ResponseMessage("Registered successfully")
    register(
        @Body() registerUserDto: RegisterUserDto
    ) {
        return this.authService.register(registerUserDto)
    }

    @Public()
    @Post('active-account')
    @ResponseMessage("Activated successfully")
    activeAccount(
        @Body() activeAccountDto: ActiveAccountDto
    ) {
        return this.authService.activeAccount(activeAccountDto)
    }

    @Public()
    @Get('retry-active/:userId')
    @ResponseMessage("Retried successfully")
    retryActive(
        @Param("userId", ParseObjectIdPipe) userId: Types.ObjectId
    ) {
        return this.authService.retryActive(userId)
    }
}
