import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Product } from './product.schema';

export type GalleryDocument = HydratedDocument<Gallery>;

@Schema({ timestamps: true })
export class Gallery {
    _id: Types.ObjectId

    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, })
    product: Product;

    @Prop({ required: true })
    imageUrl: string

    createdAt: Date;
    updatedAt: Date;
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);
GallerySchema.index({ product: 1 });
