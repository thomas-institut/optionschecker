## OptionsChecker

Utility class to check an options object and generate a clean one out
of an options specifications object

### Install
`npm i @thomas-inst/optionschecker --save`

### Usage

    let oc = new OptionsChecker(optionsDefinitionObject, contextString)

The optionsDefinition object passed to the  constructor should have as properties the
definition of each option to be checked. Each property, in turn, has the following
properties:

    optionName:  {
       required: <true/false>  // optional, if not present it defaults to false (i.e., the option is not required)
       default:  <default Value> // if required===true, the default value will be ignored
       type: 'type_string'   // optional type requirement for the option
           type_string can be a Javascript type name:  'string', 'number', 'object', 'boolean', 'function'
          it can also be one of the following:
              'NonEmptyString'
              'NumberGreaterThanZero'
              'NonZeroNumber'
              'Array'
 
      objectClass: SomeClass // if present and type==='object', the given value is checked to be a instance of this class
      checker: function (v) { .... }  // optional function that performs additional checks on the given value
      checkDescription:  <string description of additional check asdf
    }


The context string is used when generating error and warning messages to the console.

    let cleanOptions = oc.getCleanOptions(optionsObject)

cleanOptions will be populated with the right options default and types. Errors in the given
optionsObject will throw and exception will be reported in the console.    
    