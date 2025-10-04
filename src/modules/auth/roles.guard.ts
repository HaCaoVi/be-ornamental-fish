import { ROLES_KEY } from '@common/constants/constant';
import type { IToken } from '@common/interfaces/customize.interface';
import { ERole } from '@common/types/type';
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<ERole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const user: IToken = req.user;

        const hasRole = requiredRoles.some((role) => user.role?.name.includes(role));

        if (!hasRole) {
            throw new ForbiddenException({
                statusCode: 403,
                message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
                error: 'Forbidden',
            });
        }

        return true;
    }
}
