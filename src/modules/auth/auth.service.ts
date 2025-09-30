import { User } from '@modules/users/schemas/user.schema';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { UserModelType } from '@modules/users/schemas/user.schema';
import { compareHashBcrypt, hashTokenSHA256 } from '@common/helpers/security.helper';
import { JwtService } from '@nestjs/jwt';
import { IToken } from '@common/interfaces/customize.interface';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import type { Response } from 'express';
import { AccountType } from '@common/types/type';

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

    async login(user: IToken) {
        try {
            const { email, name, role, sub } = user
            const access_token = await this.signAccessTokenJWT(user);
            const refresh_token = await this.signRefreshTokenJWT(user);

            const hashToken = hashTokenSHA256(refresh_token)
            const updateRefreshToken = await this.userModel.updateOne({ _id: sub }, { refreshToken: hashToken })

            if (updateRefreshToken.modifiedCount === 0) {
                throw new InternalServerErrorException("Failed to update refresh token");
            }

            return {
                refresh_token,
                access_token,
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

    async verifyRefreshTokenJWT(token: string) {
        try {
            return this.jwtService.verify(token, {
                secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRET"),
            });
        } catch (error) {
            this.logger.warn(`Invalid refresh token: ${error.message}`);
            return null;
        }
    }

    async refreshToken(currentRefreshToken: string) {
        try {
            const user = await this.verifyRefreshTokenJWT(currentRefreshToken)
            if (!user) {
                throw new BadRequestException('Token invalid, please login again!');
            }

            const { exp, iat, ...dataToken } = user

            const isRefreshTokenValid = await this.userModel.findOne({ _id: dataToken.sub, refreshToken: hashTokenSHA256(currentRefreshToken) })

            if (!isRefreshTokenValid) {
                throw new BadRequestException(`Token invalid!`);
            }

            const [newRefreshToken, access_token] = await Promise.all([
                this.signRefreshTokenJWT(dataToken),
                this.signAccessTokenJWT(dataToken),
            ]);

            const updateRefreshToken = await this.userModel.updateOne(
                { _id: dataToken.sub },
                { $set: { refreshToken: hashTokenSHA256(newRefreshToken) } }
            );
            if (updateRefreshToken.modifiedCount === 0) {
                throw new InternalServerErrorException("Failed to update refresh token");
            }
            return {
                refresh_token: newRefreshToken,
                access_token
            };
        } catch (error) {
            this.logger.error("Refresh token error: " + error.message, error.stack);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Something went wrong!');
        }
    }
}
