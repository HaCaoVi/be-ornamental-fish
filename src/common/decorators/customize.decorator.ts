import { RESPONSE_MESSAGE_KEY } from "@common/constants/constant";
import { SetMetadata } from "@nestjs/common";

export const ResponseMessage = (message: string) =>
    SetMetadata(RESPONSE_MESSAGE_KEY, message);
