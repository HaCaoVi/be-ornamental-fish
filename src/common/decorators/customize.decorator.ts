import {
  IS_PUBLIC_KEY,
  RESPONSE_MESSAGE_KEY,
  ROLES_KEY,
} from '@common/constants/constant';
import { ERole } from '@common/types/type';
import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';

export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

export const UserReq = createParamDecorator((__, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest();
  return request.user;
});

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Cookies = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);

export const Roles = (...roles: ERole[]) => SetMetadata(ROLES_KEY, roles);
