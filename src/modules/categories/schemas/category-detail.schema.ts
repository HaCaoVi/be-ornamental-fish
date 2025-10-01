import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Category } from './category.schema';

export type CategoryDetailDocument = HydratedDocument<CategoryDetail>;

@Schema({ timestamps: true })
export class CategoryDetail {
    _id: Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true })
    category: Category;

    @Prop({ required: true })
    name: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    createdBy: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    updatedBy: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    deletedBy: Types.ObjectId;

    @Prop()
    deletedAt: Date;

    createdAt: Date;

    updatedAt: Date;
}

export const CategoryDetailSchema = SchemaFactory.createForClass(CategoryDetail);
CategoryDetailSchema.index({ category: 1 });
