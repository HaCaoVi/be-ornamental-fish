import { registerDecorator, ValidationOptions } from 'class-validator';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments
} from 'class-validator';

export function IsPastDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isPastDate',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return value instanceof Date && value.getTime() < Date.now();
                },
            },
        });
    };
}

@ValidatorConstraint({ name: 'isDiscountValid', async: false })
export class IsDiscountValid implements ValidatorConstraintInterface {
    validate(discount: number, args: ValidationArguments) {
        const object = args.object as any;
        return typeof object.price === 'number' && discount < object.price;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Discount must be less than price';
    }
}