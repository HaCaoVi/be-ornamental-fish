import { ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AuthService } from './auth.service';
import type { IToken } from '@common/interfaces/customize.interface';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ResponseMessage("Login successfully")
    async login(
        @UserReq() user: IToken,
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.login(res, user);
    }
}
