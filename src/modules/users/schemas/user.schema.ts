
import { DEFAULT_ROLE } from '@common/constants/constant';
import { SoftDeleteModel } from '@common/interfaces/customize.interface';
import { softDeletePlugin } from '@common/plugins/soft-delete.plugin';
import { EAccountType, EGender } from '@common/types/type';
import { Role } from '@modules/roles/schemas/role.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    _id: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: "" })
    avatar: string;

    @Prop({ default: "" })
    phone: string;

    @Prop()
    birthday: Date;

    @Prop({
        enum: EGender,
    })
    gender: string;

    @Prop()
    address: string;

    @Prop({
        default: EAccountType.LOCAL,
        enum: EAccountType,
    })
    accountType: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Role", default: DEFAULT_ROLE })
    role: Role;

    @Prop({ default: "" })
    refreshToken: string;

    @Prop({ default: false })
    isActivated: boolean;

    @Prop({ default: "" })
    codeActive: string

    @Prop({ default: null })
    codeExpired: Date

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: false })
    isBanned: boolean;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    createdBy: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    updatedBy: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    deletedBy: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null })
    bannedBy: User;

    @Prop()
    deletedAt: Date;

    @Prop()
    bannedAt: Date;

    createdAt: Date;

    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1, accountType: 1 }, { unique: true });

UserSchema.plugin(softDeletePlugin);

export type UserModelType = SoftDeleteModel<UserDocument>;