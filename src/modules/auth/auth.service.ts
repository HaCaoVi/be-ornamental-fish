import { User } from '@modules/users/schemas/user.schema';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { UserModelType } from '@modules/users/schemas/user.schema';
import {
  compareHashBcrypt,
  hashBcrypt,
  hashTokenSHA256,
} from '@common/helpers/security.helper';
import { JwtService } from '@nestjs/jwt';
import { IGoogleUser, IToken } from '@common/interfaces/customize.interface';
import { ConfigService } from '@nestjs/config';
import { EAccountType } from '@common/types/type';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailService } from '@modules/mail/mail.service';
import { ActiveAccountDto } from './dto/active-account.dto';
import { RegisterUserDto } from './dto/register.dto';
import { CUSTOMER_ROLE } from '@common/constants/constant';
import { Response } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Types } from 'mongoose';
import { ChangePasswordDto, UpdateProfileUserDto } from './dto/profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name) private userModel: UserModelType,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) { }

  async signAccessTokenJWT(payload: IToken) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRE'),
    });
  }

  async signRefreshTokenJWT(payload: IToken) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRE'),
    });
  }

  async findUserByUsername(username: string): Promise<any | null> {
    const user = await this.userModel
      .findOne({ email: username, accountType: EAccountType.LOCAL })
      .populate({
        path: 'role',
        select: 'name',
      })
      .lean<User>()
      .exec();
    if (!user) return null;
    return { ...user, role: user!.role.name };
  }

  async validateUser(username: string, pass: string): Promise<any | null> {
    const user = await this.findUserByUsername(username);
    if (!user) return null;
    const isMatch = await compareHashBcrypt(pass, user.password);
    return isMatch ? user : null;
  }

  async login(user: IToken) {
    try {
      const { email, name, role, sub, avatar } = user;
      const access_token = await this.signAccessTokenJWT(user);
      const refresh_token = await this.signRefreshTokenJWT(user);

      const hashToken = hashTokenSHA256(refresh_token);
      const updateRefreshToken = await this.userModel.updateOne(
        { _id: sub },
        { refreshToken: hashToken },
      );

      if (updateRefreshToken.modifiedCount === 0) {
        throw new InternalServerErrorException(
          'Failed to update refresh token',
        );
      }

      return {
        refresh_token,
        access_token,
        user: {
          _id: sub,
          email,
          name,
          role,
          avatar,
        },
      };
    } catch (error) {
      this.logger.error('Login error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async verifyRefreshTokenJWT(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      this.logger.warn(`Invalid refresh token: ${error.message}`);
      return null;
    }
  }

  async refreshToken(currentRefreshToken: string) {
    try {
      const user = await this.verifyRefreshTokenJWT(currentRefreshToken);
      if (!user) {
        throw new BadRequestException('Token invalid, please login again!');
      }
      const { exp, iat, ...dataToken } = user;

      const isRefreshTokenValid = await this.userModel.findOne({
        _id: dataToken.sub,
        refreshToken: hashTokenSHA256(currentRefreshToken),
      });

      if (!isRefreshTokenValid) {
        throw new BadRequestException(`Token invalid!`);
      }

      const [newRefreshToken, access_token] = await Promise.all([
        this.signRefreshTokenJWT(dataToken),
        this.signAccessTokenJWT(dataToken),
      ]);

      const updateRefreshToken = await this.userModel.updateOne(
        { _id: dataToken.sub },
        { $set: { refreshToken: hashTokenSHA256(newRefreshToken) } },
      );
      if (updateRefreshToken.matchedCount === 0) {
        throw new NotFoundException('User not found');
      }
      return {
        refresh_token: newRefreshToken,
        access_token,
      };
    } catch (error) {
      this.logger.error('Refresh token error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async logout(user: IToken) {
    try {
      const updated = await this.userModel.updateOne(
        { _id: user.sub },
        { $set: { refreshToken: '' } },
      );

      if (updated.matchedCount === 0) {
        throw new NotFoundException('User not found');
      }
      return 'oke';
    } catch (error) {
      this.logger.error('Logout error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async register(registerUserDto: RegisterUserDto) {
    try {
      const codeActive = uuidv4();
      const codeExpired = dayjs().add(
        +this.configService.get('MAIL_EXPIRE_IN'),
        'minute',
      );
      const hashPass = await hashBcrypt(registerUserDto.password);
      const newUser = await this.userModel.create({
        ...registerUserDto,
        password: hashPass,
        codeActive,
        codeExpired,
      });
      const callBack = async () => {
        await this.userModel.deleteOne({ _id: newUser._id });
        throw new BadRequestException('Email invalid!');
      };
      await this.mailService.sendMailAuthentication(
        registerUserDto.email,
        '【IFish】 Confirm Your Authentication',
        codeActive,
        callBack,
      );
      return {
        _id: newUser._id,
        createdAt: newUser.createdAt,
      };
    } catch (error) {
      this.logger.error('Register error: ' + error.message, error.stack);
      if (error?.code === 11000) {
        throw new BadRequestException('Email already exists!');
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async retryActive(email: string) {
    try {
      const user = await this.userModel.findOne({
        email: email,
        accountType: EAccountType.LOCAL,
      });
      if (!user) {
        throw new NotFoundException(`User not found with ${email}`);
      }
      const codeActive = uuidv4();
      const codeExpired = dayjs().add(
        +this.configService.get('MAIL_EXPIRE_IN'),
        'minute',
      );
      const updated = await this.userModel.updateOne(
        { email: email, accountType: EAccountType.LOCAL },
        { codeActive, codeExpired },
      );
      if (updated.matchedCount === 0) {
        throw new NotFoundException('Updated fail!');
      }
      await this.mailService.sendMailAuthentication(
        user.email,
        '【IFish】 Confirm Your Authentication',
        codeActive,
      );
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Retry active error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const { code, email, password } = forgotPasswordDto;
      const user = await this.userModel.findOne({
        email,
        accountType: EAccountType.LOCAL,
      });
      if (!user) {
        throw new NotFoundException(`User not found with ${email}`);
      }
      const codeExpired = dayjs(user.codeExpired);
      const now = dayjs();
      const isExpired = now.isAfter(codeExpired);
      if (isExpired) {
        throw new BadRequestException('Your code has expired!');
      }
      if (code !== user.codeActive) {
        throw new BadRequestException('Your code is invalid!');
      }
      const hashPass = await hashBcrypt(password);
      await user.updateOne({ password: hashPass });
      return;
    } catch (error) {
      this.logger.error('Forgot password error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async activeAccount(activeAccountDto: ActiveAccountDto) {
    try {
      const { email, code } = activeAccountDto;
      const user = await this.userModel.findOne({
        email: email,
        accountType: EAccountType.LOCAL,
      });
      if (!user) {
        throw new NotFoundException(`User not found with ${email}`);
      }
      if (user.isActivated) {
        throw new BadRequestException('Account already activated!');
      }
      const codeExpired = dayjs(user.codeExpired);
      const now = dayjs();
      const isExpired = now.isAfter(codeExpired);
      if (isExpired) {
        throw new BadRequestException('Your code has expired!');
      }
      if (code !== user.codeActive) {
        throw new BadRequestException('Your code is invalid!');
      }
      const updated = await this.userModel.updateOne(
        { email: email, accountType: EAccountType.LOCAL },
        { isActivated: true },
      );
      if (updated.matchedCount === 0) {
        throw new NotFoundException('Activated fail!');
      }
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Active account error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async loginWithGoogle(res: Response, user: IGoogleUser) {
    try {
      const { email, firstName, id, lastName, picture } = user;

      const hashPass = await hashBcrypt(id);

      const newUser = await this.userModel.findOneAndUpdate(
        { email, accountType: EAccountType.GOOGLE },
        {
          name: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
          avatar: picture,
          email,
          password: hashPass,
          isActivated: true,
          accountType: EAccountType.GOOGLE,
        },
        { upsert: true, new: true },
      );

      const payload = {
        sub: newUser._id,
        email,
        name: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        role: CUSTOMER_ROLE,
        avatar: newUser.avatar,
      };

      const [access_token, refresh_token] = await Promise.all([
        this.signAccessTokenJWT(payload),
        this.signRefreshTokenJWT(payload),
      ]);

      await newUser.updateOne({
        refreshToken: hashTokenSHA256(refresh_token),
      });

      // this.addRefreshTokenInCookie(res, refresh_token);

      return { access_token, refresh_token };
    } catch (error) {
      this.logger.error('Google login error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async viewProfile(id: Types.ObjectId): Promise<User> {
    try {
      const user = await this.userModel
        .findById(id)
        .select('-password -refreshToken')
        .populate({
          path: 'role',
          select: '_id name',
        })
        .lean<User>()
        .exec();
      if (!user) throw new NotFoundException(`User with id ${id} not found`);
      return user;
    } catch (error) {
      this.logger.error('Get user error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async updateProfile(
    userId: Types.ObjectId,
    updateProfileUserDto: UpdateProfileUserDto,
  ) {
    try {
      const updated = await this.userModel.updateOne(
        { _id: userId },
        { ...updateProfileUserDto, updatedBy: userId },
        { runValidators: true },
      );
      if (updated.matchedCount === 0) {
        throw new NotFoundException(
          `User with id ${userId} not found or is protected`,
        );
      }
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Updated profile error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async changePassword(
    userId: Types.ObjectId,
    changePasswordDto: ChangePasswordDto,
  ) {
    try {
      if (changePasswordDto.oldPassword === changePasswordDto.newPassword) {
        throw new BadRequestException(
          'New password must be different from the old password',
        );
      }
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException(
          `User with id ${userId} not found or is protected`,
        );
      }
      const isMatch = await compareHashBcrypt(
        changePasswordDto.oldPassword,
        user.password,
      );
      if (!isMatch) {
        throw new BadRequestException(`Incorrect password`);
      }
      const hashNewPass = await hashBcrypt(changePasswordDto.newPassword);
      await user.updateOne({ password: hashNewPass, updatedBy: userId });
      return;
    } catch (error) {
      this.logger.error('Change password error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}
