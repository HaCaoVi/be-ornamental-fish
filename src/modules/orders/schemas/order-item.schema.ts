import { User } from '@modules/users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Product } from '@modules/products/schemas/product.schema';

export type OrderItemDocument = HydratedDocument<OrderItem>;

@Schema({ timestamps: true })
export class OrderItem {
    _id: Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
    user: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true })
    product: Product;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ default: 0 })
    discount: number;

    @Prop({ required: true })
    quantity: string;

    createdAt: Date;
    updatedAt: Date;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
