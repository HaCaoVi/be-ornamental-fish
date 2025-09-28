import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
    _id: Types.ObjectId

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
