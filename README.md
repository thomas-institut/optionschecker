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

    let oc = new OptionsChecker(options)

 
If the constructor is called with only one argument, the argument is meant to be an object with the following properties:

     {
          optionsDefinition:  <an object as described below; required>
          context: <a string used to identify the checker in warning and error messages; required>
          strictDefault: <true|false, if true, options default will only be used when an option it not defined, can be overridden in any option definition>
          verbose: <true|false, if true, warnings and error will be logged to the console; default: false>
          debug: <true|false, if true, verbose mode will be turned on and more info will be logged to the console; default: false>
    }


Calling the constructor with multiple arguments will be deprecated in the next version.  The arguments will be transformed
into an object like the one above:

      {
          optionsDefinition: arg1
          context: arg2
          verbose: arg3  (default false)
      }


The optionsDefinition object  should have as properties the
definition of each option to be checked. Each property, in turn, should have the following
properties:
     
       optionName:  {
         required: <true/false>  // optional, if not present it defaults to false (i.e., the option is not required)
         default:  <default Value> // if required===true, the default value will be ignored
         strictDefault: <true|false> // if true, the default will only be used if the option is not defined, 
                                       overrides the global strictDefault flag
         type: 'type_string'   // optional type requirement for the option
             type_string can be a Javascript type name:  'string', 'number', 'object', 'boolean', 'function'
             it can also be one of the following:
                 'NonEmptyString'
                 'NumberGreaterThanZero'
                 'NonZeroNumber'
                 'Array' | 'array'
                 'custom'   // no checks done, meant to be used with a customCheck function
     
         // Additional checks
         customCheck: function  (valueToCheck) =>  { ... return true|false }, a function that performs an additional check on a value
         customCheckDescription: 'some description', a string used to report failures from the checker function
     
         // if type === 'object'
         objectClass: SomeClass // if present the given value is checked to be a instance of this class
         objectDefinition: <object> // if present the property will be checked against the given definition
     
         // if type === 'array'
         minLength: <number>    // optional minimum number of elements
         maxLength: <number>    // optional max number of elements
         elementDefinition: <object> // if present, each element in the array will be checked against the given definition
     
         // if type === 'string'
         minLength: <number> // optional minimum number of characters
         maxLength: <number> // optional max number of characters
     
         // if type==='number'
         min: <number>
         max: <number>
     
        // value transformation (e.g. normalization)
        transformFunction: (val) => { return <value to assign>}   // applied after all checks, but not to given defaults
       }

The string `contextString` is used when generating error messages and exceptions.

    let cleanOptions = oc.getCleanOptions(optionsObject)

`cleanOptions` will be populated with the right options default and types. Any property of the `optionsObject` that does
not have a definition in `optionsDefinitionsObject` will be discarded. Errors in the given `optionsObject` will throw 
an exception. 

#### Example

    let oc = new OptionsChecker({ 
        optionsDefinition: {
           x: {type: 'number', default: 100}, 
           f: {type: 'function', required: true}
        }, 
        context: 'MyOptions',  
        verbose: true  
    )

    oc.getCleanOptions({ f: () => { }, y: 'extraProperty' } )
    // ==> {  x: 100, f: () => {} }

    oc.getCleanOptions({})
    // exception thrown because the required property f is not in the given options object
    // since verbose===true an error message will be logged to the console as well