import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';

export type FoodDocument = HydratedDocument<Food>;

@Schema()
export class Food {
    _id: Types.ObjectId;

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: "Product" })
    product: Product

    @Prop({ required: true })
    weight: string

    @Prop({ required: true })
    pelletSize: string
}

export const FoodSchema = SchemaFactory.createForClass(Food);
FoodSchema.index({ product: 1 });