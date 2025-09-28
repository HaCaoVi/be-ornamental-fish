
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import type { IToken } from '@common/interfaces/customize.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super();
    }

    async validate(username: string, password: string): Promise<IToken> {
        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException("Username or password invalid!");
        }

        if (!user.isActivated) {
            throw new UnauthorizedException("Your account is not activated. Please check your email to activate.");
        }

        if (user.isBanned) {
            throw new ForbiddenException("Your account has been banned!");
        }
        const { _id, name, email, role } = user;
        return {
            sub: _id,
            name,
            email,
            role
        };
    }
}
