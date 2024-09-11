import BaseValidator from "./BaseValidator";

export default class UserValidator extends BaseValidator {
    properties_to_validate: string[];
    constructor() {
        super();
        this.properties_to_validate = ["username", "first_name", "last_name", "email", "password", "account_type", "age", "gender"];
    }
};