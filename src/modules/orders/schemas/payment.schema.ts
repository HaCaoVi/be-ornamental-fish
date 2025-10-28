import { EPaymentMethod, EPaymentStatus } from '@common/types/type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
    _id: Types.ObjectId

    @Prop({ required: true, enum: EPaymentMethod })
    method: string;

    @Prop({ required: true, enum: EPaymentStatus })
    status: string;

    @Prop({ default: null })
    transactionId: string;

    createdAt: Date;
    updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
