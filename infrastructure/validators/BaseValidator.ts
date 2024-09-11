import { ValidatorInterface } from "@/domain/validator/ValidatorInterface";
import { ValidatorResult } from "@/domain/validator/ValidatorResult";


export default class BaseValidator implements ValidatorInterface {
    properties_to_validate: string[];
    constructor() {
        this.properties_to_validate = [];
    }

    validate(obj: any): ValidatorResult {
        const messages: string[] = [];

        let targetPropertiesNames = Object.getOwnPropertyNames(obj || {});
        for (let property_name of this.properties_to_validate) {
            if (!targetPropertiesNames.includes(property_name)) {
                messages.push(`${property_name} is missing`);
            }
        }

        return { is_valid: messages.length == 0, messages };
    }
};