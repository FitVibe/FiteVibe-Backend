import { ValidatorResult } from "./ValidatorResult";

interface ValidatorInterface {
    properties_to_validate: string[];
    validate(obj: any): ValidatorResult;
}