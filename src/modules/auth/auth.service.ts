import { User } from '@modules/users/schemas/user.schema';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { UserModelType } from '@modules/users/schemas/user.schema';
import { compareHashBcrypt, hashTokenSHA256 } from '@common/helpers/security.helper';
import { JwtService } from '@nestjs/jwt';
import { IToken } from '@common/interfaces/customize.interface';
import { ConfigService } from '@nestjs/config';
import { EAccountType } from '@common/types/type';
import { RegisterUserDto } from '@modules/users/dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

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
            .findOne({ email: username, accountType: EAccountType.LOCAL })
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
            if (updateRefreshToken.matchedCount === 0) {
                throw new NotFoundException("User not found");
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

    async logout(user: IToken) {
        try {
            const updated = await this.userModel.updateOne(
                { _id: user.sub },
                { $set: { refreshToken: "" } }
            );

            if (updated.matchedCount === 0) {
                throw new NotFoundException("User not found");
            }
            return "oke"
        } catch (error) {
            this.logger.error("Logout error: " + error.message, error.stack);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Something went wrong!');
        }
    }

    async register(registerUserDto: RegisterUserDto) {
        try {
            const codeActive = uuidv4();
            const codeExpired = dayjs().add(+process.env.MAIL_EXPIRE_IN!, "minute")
            const newUser = await this.userModel.create({ ...registerUserDto, codeActive, codeExpired });
            return {
                _id: newUser._id,
                createdAt: newUser.createdAt
            }
        } catch (error) {
            this.logger.error("Register error: " + error.message, error.stack);
            if (error?.code === 11000) {
                throw new BadRequestException("Email already exists!");
            }
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Something went wrong!');
        }
    }
}
