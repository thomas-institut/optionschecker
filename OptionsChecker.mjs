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
 */

export class OptionsChecker {

    /**
     * Constructs an OptionsChecker object.
     *
     * If the constructor is called with only one argument, the argument is meant to be
     * an object with the following properties:
     *  {
     *      optionsDefinition:  <an object as described below; required>
     *      context: <a string used to identify the checker in warning and error messages; required>
     *      strictDefault: <true|false, if true, options default will only be used when an option it not defined, can be overridden in any option definition>
     *      verbose: <true|false, if true, warnings and error will be logged to the console; default: false>
     *      debug: <true|false, if true, verbose mode will be turned on and more info will be logged to the console; default: false>
     *  }
     *
     * Calling the constructor with multiple arguments will be deprecated in the next version.  The arguments will be transformed
     * into an object like the one above:
     *  {
     *      optionsDefinition: arg1
     *      context: arg2
     *      verbose: arg3  (default false)
     *  }
     *
     * The optionsDefinition object  should have as properties the
     * definition of each option to be checked. Each property, in turn, should have the following
     * properties:
     *
     *   optionName:  {
     *     required: <true/false>  // optional, if not present it defaults to false (i.e., the option is not required)
     *     default:  <default Value> // if required===true, the default value will be ignored
     *     strictDefault: <true|false> // if true, the default will only be used if the option is not defined, overrides the global strictDefault flag
     *     type: 'type_string'   // optional type requirement for the option
     *         type_string can be a Javascript type name:  'string', 'number', 'object', 'boolean', 'function'
     *         it can also be one of the following:
     *             'NonEmptyString'
     *             'NumberGreaterThanZero'
     *             'NonZeroNumber'
     *             'Array' | 'array'
     *             'custom'   // no checks done, meant to be used with a customCheck function
     *
     *     // Additional checks
     *     customCheck: function  (valueToCheck) =>  { ... return true|false }, a function that performs an additional check on a value
     *     customCheckDescription: 'some description', a string used to report failures from the checker function
     *
     *     // Objects
     *     objectClass: SomeClass // if present and type==='object', the given value is checked to be a instance of this class
     *     objectDefinition: <object> // if present and type==='object', the property will be checked against the given definition
     *
     *     // Arrays
     *     minLength: <number>
     *     maxLength: <number>
     *     elementDefinition: <object> // if present and type === 'array', each element in the array will be checked against the given definition
     *
     *     // strings
     *     minLength: <number>
     *     maxLength: <number>
     *
     *     // numbers
     *     min: <number>
     *     max: <number>
     *
     *    // value transformation (e.g. normalization)
     *    transformFunction: (val) => { return <value to assign>}   // applied after all checks, but not to given defaults
     *   }
     *
     * @param {object} constructorOptions
     * @param {null|string} contextStr  id string to use in exceptions, errors and warnings
     * @param {boolean} verbose  if true, errors and warnings will be reported in the console
     */
    constructor(constructorOptions, contextStr= null, verbose=false) {

        let constructorOptionsObject = constructorOptions
        if (contextStr !== null) {
            console.warn(`Initializing OptionsChecker with multiple arguments will be deprecated in the next version. Context: ${contextStr}`)
            // this means the old style call
            constructorOptionsObject = {
                optionsDefinition: constructorOptions,
                context: contextStr,
                verbose: verbose
            }
        }

        let checkerOptionsDefinition = {
            optionsDefinition: { type: 'object', required: true},
            context: { type: 'NonEmptyString', required: true},
            strictDefault: { type: 'boolean', default: false},
            verbose: { type: 'boolean', default: false},
            debug: { type: 'boolean', default: false}
        }
        let  cleanOptions = _getCleanOptions(constructorOptionsObject, checkerOptionsDefinition, `${contextStr === null ? 'OptionsChecker' : contextStr} constructor`, false, false, true)

        this.optionsDefinition = cleanOptions.optionsDefinition
        this.contextStr = cleanOptions.context
        this.verbose = cleanOptions.verbose
        this.strictDefault = cleanOptions.strictDefault
        this.setDebug(cleanOptions.debug)
    }

    setDebug(debug) {
        if (debug) {
            this.debug = true
            this.verbose = true
        } else {
            this.debug = false
        }
    }

    /**
     *
     * @param {object} optionsObject
     * @return {object}
     *
     */
    getCleanOptions(optionsObject) {
       return _getCleanOptions(optionsObject, this.optionsDefinition, this.contextStr, this.verbose, this.debug, this.strictDefault)
    }

    getDefaults() {
        return this.getCleanOptions({})
    }
}

function _normalizeTypeString(typeStr) {
    let type = typeStr.toLowerCase()

    switch(type) {
        case 'bool':
            return 'boolean'

        case 'func':
            return 'function'

        case 'nonemptystring':
            return 'NonEmptyString'

        case 'numbergreaterthanzero':
            return 'NumberGreaterThanZero'

        case 'nonzeronumber':
            return 'NonZeroNumber'

    }
    return type
}
function sPrettyPrint(value) {
    switch (typeof (value)) {
        case 'string':
            return `'${value}'`
        case 'object':
            if (Array.isArray(value)) {
                return `[Array]`
            }
            if (value.constructor.name !== 'Object') {
                return `[${value.constructor.name}]`
            }
            return '[Object]'
        default:
            return `${value}`
    }
}

function _getCleanOptions(optionsObject, optionsDefinition, contextStr, verbose, debug, strictDefault) {
    debug && console.log(`Getting clean options for context '${contextStr}'`)
    let cleanOptions = {}
    for (const optionName in optionsDefinition) {
        if (!optionsDefinition.hasOwnProperty(optionName)) {
            debug && console.log(`Ignoring property ${optionName}, which is not an own property of the optionsDefinition object`)
            continue
        }
        let optionDefinition = optionsDefinition[optionName]
        debug && console.log(`Checking option '${optionName}'`)
        debug && console.log(`Definition:`)
        debug && console.log(optionDefinition)
        debug && console.log(`Value to check:`)
        debug && console.log(optionsObject[optionName])
        if (optionsObject[optionName] === undefined) {
            // optionName is NOT in optionsObject
            if (optionDefinition.required) {
                _throwError(`Required option '${optionName}' not found`, contextStr, verbose)
            }
            if (optionDefinition.default === undefined) {
                _throwError(`No default defined for option '${optionName}'`, contextStr, verbose)
            }
            debug && console.log(`Assigning default`)
            cleanOptions[optionName] = optionDefinition.default
            continue;
        }
        // optionName is present in optionsObject
        // check type
        if (optionDefinition.type === undefined) {
            // no type given, nothing else to do
            continue
        }
        if (typeof optionDefinition.type !== 'string' || optionDefinition.type === '') {
            // bad type given
            _throwError(`Invalid type in definition for ${optionName}, need a non-empty string, ${sPrettyPrint(optionDefinition.type)} given`,
                contextStr, verbose)
        }
        // pre-process type
        let definitionType = _normalizeTypeString(optionDefinition.type)
        switch(definitionType) {
            case 'NonEmptyString':
                definitionType = 'string'
                optionDefinition.type = 'string'
                optionDefinition.minLength = 1
                optionDefinition.maxLength = undefined
                break
        }
        debug && console.log(`Normalized definition type: '${definitionType}'`)

        let checkFail = false
        let checkFailMessage = ''
        let cleanValueAssigned = false

        switch(definitionType)  {
            case 'function':
            case 'boolean':
                if (typeof optionsObject[optionName] !== definitionType) {
                    checkFail = true
                    checkFailMessage = `${optionName} should be a ${optionDefinition.type}, ${sPrettyPrint(typeof optionsObject[optionName])} given`
                }
                break

            case 'number':
                if (typeof(optionsObject[optionName]) === 'number') {
                    if (optionDefinition['min'] !== undefined) {
                        if (optionsObject[optionName] < optionDefinition['min']) {
                            checkFail = true
                            checkFailMessage = `Number '${optionName}' should be equal to or greater than ${optionDefinition['min']}, ${optionsObject[optionName]} given`
                        }
                    }
                    if (optionDefinition['max'] !== undefined) {
                        if (optionsObject[optionName] > optionDefinition['max']) {
                            checkFail = true
                            checkFailMessage = `Number '${optionName}' should be equal to or lesser than ${optionDefinition['max']}, ${optionsObject[optionName]} given`
                        }
                    }
                } else {
                    checkFail = true
                    checkFailMessage = `${optionName} should be a number, ${sPrettyPrint(typeof optionsObject[optionName])} given`
                }
                break

            case 'NonEmptyString':
                if (typeof optionsObject[optionName] !== 'string' || optionsObject[optionName] === '') {
                    checkFail = true
                    checkFailMessage = `${optionName} should be a non-empty string, ${sPrettyPrint(optionsObject[optionName])} given`
                }
                break


            case 'NumberGreaterThanZero':
                if (typeof optionsObject[optionName] !== 'number' || optionsObject[optionName] <= 0) {
                    checkFail = true
                    checkFailMessage = `${optionName} should be a number greater than zero, ${sPrettyPrint(optionsObject[optionName])} given`
                }
                break

            case 'NonZeroNumber':
                if (typeof optionsObject[optionName] !== 'number' || optionsObject[optionName] === 0) {
                    checkFail = true
                    checkFailMessage = `${optionName} should be a number not equal to zero, ${sPrettyPrint(optionsObject[optionName])} given`
                }
                break

            case 'string':
                if (typeof optionsObject[optionName] !== 'string') {
                    checkFail = true
                    checkFailMessage = `${optionName} should be a string, ${sPrettyPrint(typeof optionsObject[optionName])} given`
                    break
                }
                if (optionDefinition['minLength'] !== undefined) {
                    if (optionsObject[optionName].length < optionDefinition['minLength']) {
                        checkFail = true
                        checkFailMessage = `String '${optionName}' should be at least ${optionDefinition['minLength']} characters(s) long, it has ${optionsObject[optionName].length}`
                    }
                }
                if (optionDefinition['maxLength'] !== undefined) {
                    if (optionsObject[optionName].length > optionDefinition['maxLength']) {
                        checkFail = true
                        checkFailMessage = `String '${optionName}' should not have more than ${optionDefinition['maxLength']} character(s), it has ${optionsObject[optionName].length}`
                    }
                }
                break

            case 'object':
                if (typeof optionsObject[optionName] !== 'object') {
                    checkFail = true
                    checkFailMessage = `${optionName} must be an object, ${sPrettyPrint(typeof optionsObject[optionName])} given`
                    break
                }
                // if we have an objectClass, check for it
                if (optionDefinition['objectClass'] !== undefined) {
                    if (!(optionsObject[optionName] instanceof optionDefinition['objectClass'])) {
                        checkFail = true
                        checkFailMessage = `${optionName} must be an object of class ${optionDefinition['objectClass'].name},` +
                            ` ${optionsObject[optionName].constructor.name} given, will assign default`
                        break
                    }
                }
                // if there's an object definition, check it
                if (optionDefinition['objectDefinition'] !== undefined) {
                    let newOc = new OptionsChecker({
                        optionsDefinition: optionDefinition['objectDefinition'],
                        context:  `${contextStr} : ${optionName}`,
                        verbose: verbose,
                        debug: debug
                    })
                    let cleanObject = {}
                    try {
                        cleanObject = newOc.getCleanOptions(optionsObject[optionName])
                    } catch (e) {
                        checkFail = true
                        checkFailMessage = e
                    }
                    // if we get here newOc.getCleanOptions ran fine
                    if (!checkFail) {
                        cleanOptions[optionName] = cleanObject
                        cleanValueAssigned = true
                    }
                }
                break

            case 'array':
                if (!Array.isArray(optionsObject[optionName])) {
                    checkFail = true
                    checkFailMessage = `${optionName} must be an array, ${sPrettyPrint(typeof optionsObject[optionName])} given`
                    break
                }
                if (optionDefinition['minLength'] !== undefined && optionsObject[optionName].length < optionDefinition['minLength']) {
                    checkFail = true
                    checkFailMessage = `Array '${optionName}' should have at least ${optionDefinition['minLength']} element(s), it has ${optionsObject[optionName].length}`
                    break
                }
                if (optionDefinition['maxLength'] !== undefined && optionsObject[optionName].length > optionDefinition['maxLength']) {
                    checkFail = true
                    checkFailMessage =`Array '${optionName}' should not have more than ${optionDefinition['maxLength']} element(s), it has ${optionsObject[optionName].length}`
                }

                if (optionDefinition['elementDefinition'] !== undefined) {
                    // apply the definition to every element in the array
                    try {
                        cleanOptions[optionName] = optionsObject[optionName].map((ele, i) => {

                            let newOc = new OptionsChecker( {
                                optionsDefinition: { element: optionDefinition['elementDefinition'] },
                                context: `${contextStr} : ${optionName} : element ${i}`,
                                verbose: verbose,
                                debug: debug })
                            return newOc.getCleanOptions( { element: ele})['element']
                        })
                    } catch (e) {
                        checkFail = true
                        checkFailMessage = e
                    }
                    if (!checkFail) {
                        cleanValueAssigned = true
                    }
                }
                break

            case 'custom':
                // do nothing, will perform custom checker function later
                break

            default:
                _throwError(`Unrecognized type '${optionDefinition.type}' in the definition of '${optionName}'`, contextStr, verbose)
        }

        // Perform extra check if no errors found
        if (!checkFail && optionDefinition.customCheck !== undefined) {
            if (!optionDefinition.customCheck(optionsObject[optionName])) {
                // custom check fails
                checkFail = true
                checkFailMessage = `${optionName} must be ${optionDefinition.customCheckDescription}, ` +
                    `${sPrettyPrint(optionsObject[optionName])} given`
            }
        }

        if (checkFail) {
            let optionStrictDefault = optionDefinition.strictDefault !== undefined ? optionDefinition.strictDefault : strictDefault

            if (optionStrictDefault || optionDefinition.default === undefined) {
                _throwError(checkFailMessage, contextStr, verbose)
            }
            else {
                verbose && console.warn(`${checkFailMessage}. Default assigned.`)
                cleanOptions[optionName] = optionDefinition.default
            }
        } else {
            if (!cleanValueAssigned) {
                cleanOptions[optionName] = optionsObject[optionName]
            }
            // apply transform function, if there's any
            if (optionDefinition['transformFunction'] !== undefined && typeof(optionDefinition['transformFunction']) === 'function') {
                debug && console.log(`Applying transform function`)
                cleanOptions[optionName] = optionDefinition['transformFunction'](cleanOptions[optionName])
                if (cleanOptions[optionName] === undefined) {
                    _throwError(`Transform function returned undefined value for option ${optionName}`, contextStr, verbose)
                }
            }
        }

    }
    return cleanOptions;
}


function _throwError(message, context, verbose) {
    let errorMessage = `${context} : ${message}`
    verbose && console.error(errorMessage)
    throw new Error(errorMessage)
}