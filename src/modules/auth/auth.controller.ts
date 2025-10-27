import { Cookies, Public, ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import { Body, Controller, Get, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AuthService } from './auth.service';
import type { IGoogleUser, IToken } from '@common/interfaces/customize.interface';
import { ActiveAccountDto, RetryActiveAccountDto } from './dto/active-account.dto';
import { RegisterUserDto } from './dto/register.dto';
import { GoogleAuthGuard } from './passport/google-auth.guard';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto, UpdateProfileUserDto } from './dto/profile.dto';
import { CartsService } from '@modules/carts/carts.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ResponseMessage("Login successfully")
    login(
        @Res({ passthrough: true }) res: Response,
        @UserReq() user: IToken
    ) {
        return this.authService.login(res, user);
    }

    @Get('account')
    async getInfo(
        @UserReq() user: IToken
    ) {
        const { iat, exp, sub, ...data } = user;
        return { _id: sub, ...data };
    }

    @Public()
    @Get('refresh')
    @ResponseMessage("Refresh successfully")
    refreshToken(
        @Res({ passthrough: true }) res: Response,
        @Cookies('refresh_token') refreshToken: string
    ) {
        return this.authService.refreshToken(res, refreshToken)
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
    @Patch('active-account')
    @ResponseMessage("Activated successfully")
    activeAccount(
        @Body() activeAccountDto: ActiveAccountDto
    ) {
        return this.authService.activeAccount(activeAccountDto)
    }

    @Public()
    @Post('retry-active')
    @ResponseMessage("Please check your email to validation code!")
    retryActive(
        @Body() req: RetryActiveAccountDto
    ) {
        return this.authService.retryActive(req.email)
    }

    @Public()
    @Patch('forgot-password')
    @ResponseMessage("Password reset successful")
    forgotPassword(
        @Body() forgotPasswordDto: ForgotPasswordDto
    ) {
        return this.authService.forgotPassword(forgotPasswordDto)
    }

    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() { }

    @Public()
    @Get('google/redirect')
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(
        @UserReq() user: IGoogleUser,
        @Res() res: Response
    ) {
        const token = await this.authService.loginWithGoogle(res, user);
        const frontendUrl = `${this.configService.get<string>("FE_ORIGIN_URL")}/auth/google-success?token=${token.access_token}`;
        return res.redirect(frontendUrl);
    }

    @Get('view-profile')
    viewProfile(
        @UserReq() user: IToken,
    ) {
        return this.authService.viewProfile(user.sub);
    }

    @Patch('update-profile')
    @ResponseMessage("Updated successfully")
    updateProfile(
        @UserReq() user: IToken,
        @Body() updateProfileUserDto: UpdateProfileUserDto
    ) {
        return this.authService.updateProfile(user.sub, updateProfileUserDto);
    }

    @Patch('change-password')
    @ResponseMessage("Updated successfully")
    changePassword(
        @UserReq() user: IToken,
        @Body() changePasswordDto: ChangePasswordDto
    ) {
        return this.authService.changePassword(user.sub, changePasswordDto);
    }
}
