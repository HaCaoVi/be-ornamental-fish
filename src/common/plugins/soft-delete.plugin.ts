import { Query, Schema } from 'mongoose';

type MongooseQuery = Query<any, any>;

export function softDeletePlugin(schema: Schema) {
    schema.statics.countDocumentsSoftDelete = function (filter?: any) {
        return this.countDocuments({
            ...filter,
            isDeleted: { $ne: true },
        });
    };

    // method at model level (static method)
    schema.statics.softDeleteOne = function (filter: any, deletedBy: string) {
        return this.updateOne(filter, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy,
                // ...(deletedBy ? { deletedBy } : {}),
            },
        });
    };

    // method at model level (static method)
    schema.statics.softDeleteMany = async function (filter: any, deletedBy: string) {
        return this.updateMany(filter, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy
                // ...(deletedBy ? { deletedBy } : {}),
            },
        });
    };

    // middleware auto add { isDeleted: false } if not have
    schema.pre(/^find/, function (next) {
        const query = this as MongooseQuery;

        if (query.getOptions().overrideDeleted) {
            return next();
        }

        const filter = query.getFilter() as Record<string, any>;
        if (!('isDeleted' in filter)) {
            query.where({ isDeleted: false });
        }

        next();
    });

}
