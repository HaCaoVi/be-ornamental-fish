import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
    _id: Types.ObjectId

    @Prop({ required: true })
    name: string;

    createdAt: Date;
    updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
