## OptionsChecker

Utility class to check an options object and generate a clean one out
of an options specifications object.

### Install

`npm i @thomas-inst/optionschecker --save`

You can then import it in your code with your preferred tool, e.g, webpacker

`import {OptionsChecker} from '@thomas-inst/optionschecker'`

or, you can include one of the standalone, prepackaged js files under `dist` in your html:

`<script src="./some_path/node_modules/@thomas-inst/optionschecker/dist/OptionsChecker.min.js><script>`

### Usage

    let oc = new OptionsChecker(optionsDefinitionObject, contextString, verbose)

Every property in the optionsDefinitionObject is an object that defines a property of the options object that will be tested 
and "cleaned up" with `getCleanOptions`: 

     {
       required: <true|false>  // optional, if not present it defaults to false (i.e., the option is not required)
       default:  <default Value> // if required === true, the default value will be ignored
       type: 'type_string'   // optional type requirement for the option
                             // type_string can be a Javascript type name:  'string', 'number', 'object', 'boolean', 'function'
                             // it can also be one of the following:
                             // 'NonEmptyString'
                             // 'NumberGreaterThanZero'
                             // 'NonZeroNumber'
                             // 'Array'
 
       objectClass: SomeClass // if present and type==='object', the option is required to be an instance of this class
       checker:  (value) =>  { ....;  return <true|false> }  // optional function that performs custom checks on the given value
       checkDescription: 'some string' // a string that describes what the the checker does, it used for messages and exceptions
    }

The string `contextString` is used when generating error messages and exceptions

    let cleanOptions = oc.getCleanOptions(optionsObject)

`cleanOptions` will be populated with the right options default and types. Any property of the `optionsObject` that does
not have a definition in `optionsDefinitionsObject` will be discarded. Errors in the given `optionsObject` will throw 
an exception. If `verbose` is true, warnings and errors will be logged to the console. By default, `verbose` is false.

#### Example

    let oc = new OptionsChecker({ 
        x: {type: 'number', default: 100}, 
        f: {type: 'function', required: true}}, 
        'MyOptions',  // contextString
        true  // verbose
    )

    oc.getCleanOptions({ f: () => { }, y: 'extraProperty' } )
    // ==> {  x: 100, f: () => {} }

    oc.getCleanOptions({})
    // exception thrown because the required property f is not in the given options object
    // since verbose===true an error message will be logged to the console as well