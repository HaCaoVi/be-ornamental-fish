import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';

export type FishDocument = HydratedDocument<Fish>;

@Schema()
export class Fish {
    _id: Types.ObjectId;

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: "Product" })
    product: Product

    @Prop({ required: true })
    color: string

    @Prop({ required: true })
    origin: string

    @Prop({ required: true })
    size: string
}
export const FishSchema = SchemaFactory.createForClass(Fish);
FishSchema.index({ product: 1 });