import { Cookies, Public, ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AuthService } from './auth.service';
import type { IToken } from '@common/interfaces/customize.interface';

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
    @ResponseMessage("Refresh Successfully")
    refreshToken(
        @Cookies('refresh_token') refreshToken: string
    ) {
        return this.authService.refreshToken(refreshToken)
    }
}
