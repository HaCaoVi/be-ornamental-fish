import { SoftDeleteModel } from '@common/interfaces/customize.interface';
import { softDeletePlugin } from '@common/plugins/soft-delete.plugin';
import { Category } from '@modules/categories/schemas/category.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
    _id: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ default: 0 })
    discount: number;

    @Prop({ required: true })
    mainImageUrl: string;

    @Prop({ default: null })
    videoImageUrl: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    category: Category;

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

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ isDeleted: 1, category: 1 });
ProductSchema.index({ name: "text", code: "text" });
ProductSchema.plugin(softDeletePlugin);
export type ProductModelType = SoftDeleteModel<ProductDocument>;