import { IsEnum, IsNotEmpty } from 'class-validator';
import { EStatus } from '@common/types/type';

export class UpdateOrderDto {
    @IsEnum(EStatus, { message: `status must be one of: ${Object.values(EStatus).join(', ')}` })
    @IsNotEmpty({ message: 'status cannot be empty' })
    status: EStatus;
}
