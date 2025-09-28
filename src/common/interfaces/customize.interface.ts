import { Model } from "mongoose";

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