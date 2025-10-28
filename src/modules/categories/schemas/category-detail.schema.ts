import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Category } from './category.schema';
import { softDeletePlugin } from '@common/plugins/soft-delete.plugin';
import { SoftDeleteModel } from '@common/interfaces/customize.interface';
import { User } from '@modules/users/schemas/user.schema';

export type CategoryDetailDocument = HydratedDocument<CategoryDetail>;

@Schema({ timestamps: true })
export class CategoryDetail {
  _id: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Category;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  createdBy: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  updatedBy: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  deletedBy: User;

  @Prop()
  deletedAt: Date;

  createdAt: Date;

  updatedAt: Date;
}

export const CategoryDetailSchema =
  SchemaFactory.createForClass(CategoryDetail);
CategoryDetailSchema.index({ category: 1 });
CategoryDetailSchema.index({ name: 1, isDeleted: 1 }, { unique: true });
CategoryDetailSchema.plugin(softDeletePlugin);
export type CategoryDetailModelType = SoftDeleteModel<CategoryDetailDocument>;
