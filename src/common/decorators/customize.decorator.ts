import { IS_PUBLIC_KEY, RESPONSE_MESSAGE_KEY } from "@common/constants/constant";
import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";

export const ResponseMessage = (message: string) =>
    SetMetadata(RESPONSE_MESSAGE_KEY, message);

export const UserReq = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);