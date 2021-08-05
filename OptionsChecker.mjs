/*
 *  Copyright (C) 2019-2021 Universität zu Köln
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * Utility class to check and generate a "clean"  options object
 *
 *
 */

export default class OptionsChecker {

    /**
     * Constructs an OptionsChecker object.
     *
     * The optionsDefinition object  should have as properties the
     * definition of each option to be checked. Each property, in turn, should have the following
     * properties:
     *
     *   optionName:  {
     *     required: <true/false>  // optional, if not present it defaults to false (i.e., the option is not required)
     *     default:  <default Value> // if required===true, the default value will be ignored
     *     type: 'type_string'   // optional type requirement for the option
     *         type_string can be a Javascript type name:  'string', 'number', 'object', 'boolean', 'function'
     *         it can also be one of the following:
     *             'NonEmptyString'
     *             'NumberGreaterThanZero'
     *             'NonZeroNumber'
     *             'Array'
     *
     *     objectClass: SomeClass // if present and type==='object', the given value is checked to be a instance of this class
     *     checker: function  (valueToCheck) =>  { ... return true/false }, a function that performs an additional
     *          check on a value
     *     checkDescription: 'some description', a string used to report failures from the checker function
     *   }
     *
     * @param {object} optionsDefinition
     * @param {string} contextStr  id string to use in exceptions, errors and warnings
     * @param {boolean} verbose  if true, errors and warnings will be reported in the console
     */
    constructor(optionsDefinition, contextStr, verbose = false) {
        this.optionsDefinition = optionsDefinition;
        this.contextStr = contextStr;
        this.verbose = verbose
    }

    /**
     *
     * @param {object} optionsObject
     * @return {object}
     *
     */
    getCleanOptions(optionsObject) {

        let cleanOptions = {};
        for (const optionName in this.optionsDefinition) {
            if (!this.optionsDefinition.hasOwnProperty(optionName)) {
                continue;
            }
            let optionDefinition = this.optionsDefinition[optionName];
            if (this._isUndefined(optionsObject[optionName])) {
                // optionName is NOT  in optionsObject
                if (optionDefinition.required) {
                    this._throwError(`Required option '${optionName}' not found`);
                }
                if (this._isUndefined(optionDefinition.default)) {
                    this._throwError(`No default defined for option '${optionName}'`);
                }
                cleanOptions[optionName] = optionDefinition.default;
                continue;
            }
            // optionName is present in optionsObject
            let typeOK = true;
            let additionalCheckOk = true;
            // first, check just for the given type
            if (this._isOfType(optionDefinition.type, 'NonEmptyString') &&
                !this._isOfType(optionsObject[optionName], optionDefinition.type)) {
                this._logWarnMessage(`${optionName} must be ${optionDefinition.type}, ` +
                    `${this._toNiceString(optionsObject[optionName])} given, will assign default`);
                typeOK = false;
            }
            // if we have an objectClass, check for it
            if (typeOK && optionDefinition.type === 'object' && !this._isUndefined(optionDefinition['objectClass'])) {
                if (!(optionsObject[optionName] instanceof optionDefinition['objectClass'])) {
                    this._logWarnMessage(`${optionName} must be an object of class ${optionDefinition['objectClass'].name},` +
                        ` ${optionsObject[optionName].constructor.name} given, will assign default`);
                    typeOK = false;
                }
            }
            if (this._isOfType(optionDefinition['checker'], 'function') &&
                !optionDefinition['checker'](optionsObject[optionName])) {
                this._logWarnMessage(`${optionName} must be ${optionDefinition['checkDescription']}, ` +
                    `${this._toNiceString(optionsObject[optionName])} given, will assign default`);
                additionalCheckOk = false;
            }
            if (typeOK && additionalCheckOk) {
                cleanOptions[optionName] = optionsObject[optionName];
            }
            else {
                if (this._isUndefined(optionDefinition.default)) {
                    this._throwError(`Given ${optionName} is not valid, but there is no default value defined`);
                }
                else {
                    cleanOptions[optionName] = optionDefinition.default;
                }
            }
        }
        return cleanOptions;
    }

    getDefaults() {
        return this.getCleanOptions({})
    }

    _genErrorMessage(msg) {
        return `${this.contextStr}: ${msg}`;
    }

    _throwError(message) {
        this.verbose && console.error(this._genErrorMessage(message));
        throw this._genErrorMessage(message);
    }

    _logWarnMessage(message) {
        this.verbose && console.warn(this._genErrorMessage(message));
    }

    _isOfType(value, type) {
        switch (type) {
            case 'string':
            case 'number':
            case 'object':
            case 'boolean':
            case 'function':
                // normal javascript type
                return (typeof (value) === type)

            case 'Bool':
            case 'bool':
                return (typeof (value)=== 'boolean')

            case 'NonEmptyString':
                return typeof (value) === 'string' && value !== ''

            case 'NumberGreaterThanZero':
                return typeof (value) === 'number' && value > 0


            case 'NonZeroNumber':
                return typeof (value) === 'number' && value !== 0

            case 'Array':
            case 'array':
                return Array.isArray(value)

            default:
                this._throwError(`Unsupported type '${type}' found in options definition`)
        }
    }

    _isUndefined(value) {
        return typeof (value) === 'undefined';
    }


    _toNiceString(value) {
        switch (typeof (value)) {
            case 'string':
                return `'${value}'`;
            case 'object':
                if (Array.isArray(value)) {
                    return `[Array]`;
                }
                if (value.constructor.name !== 'Object') {
                    return `[${value.constructor.name}]`;
                }
                return '[Object]';
            default:
                return `${value}`;
        }
    }
}
