
import { SoftDeleteModel } from '@common/interfaces/customize.interface';
import { Role } from '@modules/roles/schemas/role.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Gender {
    Male = 'MALE',
    Female = 'FEMALE',
    Other = 'OTHER',
}

export enum AccountType {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
    FACEBOOK = 'FACEBOOK',
}

@Schema({ timestamps: true })
export class User {
    _id: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop()
    birthday: Date;

    @Prop({
        enum: Gender,
    })
    gender: string;

    @Prop()
    address: string;

    @Prop({
        default: AccountType.LOCAL,
        enum: AccountType,
    })
    accountType: AccountType

    @Prop({ type: Types.ObjectId, ref: "Role" })
    role: Role;

    @Prop({ default: null })
    refreshToken: string;

    @Prop({ default: null })
    isActivated: boolean;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: false })
    isBanned: boolean;

    @Prop({ type: Types.ObjectId, ref: "User", default: null })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "User", default: null })
    updatedBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "User", default: null })
    deletedBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "User", default: null })
    bannedBy: Types.ObjectId;

    @Prop()
    deletedAt: Date;

    @Prop()
    bannedAt: Date;

    createdAt: Date;

    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1, accountType: 1 }, { unique: true });

export type UserModelType = SoftDeleteModel<UserDocument>;
