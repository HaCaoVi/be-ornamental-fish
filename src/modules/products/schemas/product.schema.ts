import { SoftDeleteModel } from '@common/interfaces/customize.interface';
import { softDeletePlugin } from '@common/plugins/soft-delete.plugin';
import { CategoryDetail } from '@modules/categories/schemas/category-detail.schema';
import { User } from '@modules/users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
    _id: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
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
    mainVideoUrl: string;

    @Prop({ default: false })
    isActivated: boolean

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "CategoryDetail", required: true })
    categoryDetail: CategoryDetail;

    @Prop({ default: false })
    isDeleted: boolean

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    createdBy: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    updatedBy: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    deletedBy: User;

    @Prop()
    deletedAt: Date;

    createdAt: Date;

    updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ isDeleted: 1, categoryDetail: 1 });
ProductSchema.index({ name: "text", code: "text" });
ProductSchema.plugin(softDeletePlugin);
export type ProductModelType = SoftDeleteModel<ProductDocument>;