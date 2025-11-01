import { EStatus } from '@common/types/type';
import { User } from '@modules/users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Payment } from './payment.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  })
  payment: Payment;

  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  phone: string;

  @Prop({
    type: {
      code: { type: String },
      location: { type: String },
    },
    _id: false,
  })
  address: { code: string; location: string };

  @Prop({ default: null })
  note: string;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  shippingFee: number;

  @Prop({ default: EStatus.PENDING, enum: EStatus })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  updatedBy: User;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
