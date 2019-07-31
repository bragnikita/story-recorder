import {ClassType} from "class-transformer/ClassTransformer";
import {classToPlain, ClassTransformOptions, plainToClass, plainToClassFromExist} from "class-transformer";

export function jsonToClassSingle<T, V>(cls: ClassType<T>, plain: V, options?: ClassTransformOptions) {
    return plainToClass(cls, plain, options);
}
export function jsonToObjectSingle<T, V>(obj: T, plain: V, options?: ClassTransformOptions) {
    return plainToClassFromExist(obj, plain, options);
}
export function objectToJson<T, V>(obj: T, options?: ClassTransformOptions) {
    return classToPlain(obj, options);
}