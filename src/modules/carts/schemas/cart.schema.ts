import { Product } from '@modules/products/schemas/product.schema';
import { User } from '@modules/users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
    _id: Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
    user: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true })
    product: Product;

    @Prop({ min: 0, required: true })
    quantity: number

    createdAt: Date;
    updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
