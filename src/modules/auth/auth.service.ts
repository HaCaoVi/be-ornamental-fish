import { AccountType, User } from '@modules/users/schemas/user.schema';
import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { UserModelType } from '@modules/users/schemas/user.schema';
import { compareHashBcrypt, hashTokenSHA256 } from '@common/helpers/security.helper';
import { JwtService } from '@nestjs/jwt';
import { IToken } from '@common/interfaces/customize.interface';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import type { Response } from 'express';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectModel(User.name) private userModel: UserModelType,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async signAccessTokenJWT(payload: IToken) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>("JWT_ACCESS_TOKEN_SECRET"),
            expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRE")
        })
    }

    async signRefreshTokenJWT(payload: IToken) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRET"),
            expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRE")
        })
    }

    addRefreshTokenInCookie(res: Response, token: string) {
        res.clearCookie("refresh_token")
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: this.configService.get<string>("NODE_ENV") === "production",
            maxAge: +ms(this.configService.get<string>("JWT_REFRESH_EXPIRE") as ms.StringValue),
            sameSite: "strict",
        })
    }

    async findUserByUsername(username: string): Promise<User | null> {
        const user = await this.userModel
            .findOne({ email: username, accountType: AccountType.LOCAL })
            .populate({
                path: "role",
                select: "_id name"
            })
            .lean<User>()
            .exec();
        return user ?? null;
    }

    async validateUser(username: string, pass: string): Promise<User | null> {
        const user = await this.findUserByUsername(username);
        if (!user) return null;

        const isMatch = await compareHashBcrypt(pass, user.password);
        return isMatch ? user : null;
    }

    async login(res: Response, user: IToken) {
        try {
            const { email, name, role, sub } = user
            const access_token = await this.signAccessTokenJWT(user);
            const refresh_token = await this.signRefreshTokenJWT(user);

            const hashToken = hashTokenSHA256(refresh_token)
            const updateRefreshToken = await this.userModel.updateOne({ _id: sub }, { refreshToken: hashToken })

            if (updateRefreshToken.modifiedCount === 0) {
                throw new InternalServerErrorException("Failed to update refresh token");
            }

            this.addRefreshTokenInCookie(res, refresh_token)

            return {
                access_token: access_token,
                user: {
                    _id: sub,
                    email,
                    name,
                    role,
                }
            };
        } catch (error) {
            this.logger.error("Login error: " + error.message, error.stack);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Something went wrong!');
        }
    }
}
