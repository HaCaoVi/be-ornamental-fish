import { Product } from '@modules/products/schemas/product.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type StockDocument = HydratedDocument<Stock>;

@Schema({ timestamps: true })
export class Stock {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    ref: 'Product',
    type: mongoose.Schema.Types.ObjectId
  })
  product: Product;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ default: 0, min: 0 })
  sold: number;

  createdAt: Date;
  updatedAt: Date;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
StockSchema.index({ product: 1 });
