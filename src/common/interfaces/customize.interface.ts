import { Model, Types } from "mongoose";

export interface Response<T> {
    statusCode: number,
    message?: string,
    data: T,
}

export interface SoftDeleteModel<T> extends Model<T> {
    softDeleteOne(filter: any, deletedBy?: string): Promise<any>;
    softDeleteMany(filter: any, deletedBy?: string): Promise<any>;
    countDocumentsSoftDelete(filter?: any): Promise<number>;
}

export interface IToken {
    sub: Types.ObjectId,
    email: string,
    name: string,
    role: string,
    avatar: string,
    iat?: number,
    exp?: number
}

export interface IGoogleUser {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    picture: string,
    accessToken: string,
};

export interface PaginatedResult<T> {
    meta: {
        current: number,
        pageSize: number,
        pages: number,
        total: number,
    },
    result: T[],
}