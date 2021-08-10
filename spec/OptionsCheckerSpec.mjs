/*
 *  Copyright (C) 2021 Universität zu Köln
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


import {OptionsChecker} from '../OptionsChecker.mjs';


describe("OptionsChecker", () => {
    describe("Basic checking",  () => {

        it("should generate defaults",  () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option1 : { default: 'defaultOption1'},
                    option2 : { default: 'defaultOption2'}
                },
                context: 'Defaults Test'
            })

            let defaults = oc.getDefaults()
            expect(defaults.option1).toBe('defaultOption1')
            expect(defaults.option2).toBe('defaultOption2')

            let oc2 = new OptionsChecker({
                optionsDefinition: {
                    option1: {},
                    option2: { default: 'defaultOption2'}
                },
                context: 'No Default Test'
            })
            expect(() => {oc2.getDefaults()}).toThrow()
        })

        it('should throw error on missing required parameters',  () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option1 : { required: true},
                    option2 : { default: 'defaultOption2'}
                },
                context: 'Required Parameters Test'
            })
            expect(() => {oc.getCleanOptions({})}).toThrow()
        })

        it('should throw error on wrong type',  () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option2 : { type: 'someBadType', default: 'defaultOption2'}
                },
                context: 'Wrong Type Test'
            })
            expect(() => {oc.getCleanOptions({ option2: 123 })}).toThrow()
        })

        it ("should check types correctly",  () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option1 : { type: 'string', default: 'defaultOption1'},
                    option2 : { type: 'number', default: 102},
                    option3 : { type: 'NonEmptyString', default: 'test'},
                    option4 : { type: 'NumberGreaterThanZero', default: 104},
                    option5 : { type: 'NonZeroNumber', default: 105},
                    option6 : { type: 'Array', default: []},
                },
                context: 'Types Test'
            })
            let testOptions1 = {
                option1: [1, 2, 3],
                option2: 'someString',
                option3: '',
                option4: -1,
                option5: 0,
                option6: {}
            }
            let d1 = oc.getCleanOptions(testOptions1)
            expect(d1.option1).toBe('defaultOption1')
            expect(d1.option2).toBe(102)
            expect(d1.option3).toBe('test')
            expect(d1.option4).toBe(104)
            expect(d1.option5).toBe(105)
            expect(d1.option6).toEqual([])

            let testOptions2 = {
                option1: 'myString',
                option2: 1002,
                option3: 'someString',
                option4: 1004,
                option5: 1005,
                option6: [ 1, 2, 3 ]
            }
            let d2 = oc.getCleanOptions(testOptions2)
            expect(d2).toEqual(testOptions2)
        } )

        it ("should deal with numbers", () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option1: {type: 'number', min: 1, max: 10}
                },
                context: "Number test"
            })
            expect(()=> {oc.getCleanOptions({option1: 0})}).toThrow()
            expect(()=> {oc.getCleanOptions({option1: 11})}).toThrow()
            expect(oc.getCleanOptions({option1: 5}).option1).toBe(5)
        } )

        it ("should call checker functions",  () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option1 : { type: 'string', default: 'defaultOption1'},
                    option2 : {
                        type: 'number',
                        customCheck: (v) => { return v > 0 },
                        customCheckDescription: 'greater than 0'
                    }
                },
                context: 'Checker Function Test'
            })
            let testOptions1 = { option1: 2, option2: -1}
            expect( ()=> {oc.getCleanOptions(testOptions1)}).toThrow()

            let testOptions2 = { option1: 'myValue', option2: 4}
            let d2 = oc.getCleanOptions(testOptions2)
            expect(d2.option1).toBe('myValue')
            expect(d2.option2).toBe(4)

            let oc2 = new OptionsChecker( {
                context: 'Custom Checker Test',
                optionsDefinition: {
                    customOption: {
                        type : 'custom',
                        customCheck: (val) => {
                            let numbers = [ 'zero', 'one', 'two', 'three']
                            if (typeof val === 'string') {
                                if (numbers.indexOf(val) === -1) {
                                    return false
                                }
                            } else if (typeof val === 'number') {
                                if (val % 1 || val < 0 || val > 3) {
                                    return false
                                }
                            } else {
                                return false
                            }
                            return true
                        }
                    }
                }
            })
            expect( ()=> {oc2.getCleanOptions({customOption: 4})}).toThrow()
            expect( ()=> {oc2.getCleanOptions({customOption: 4.001})}).toThrow()
            expect( ()=> {oc2.getCleanOptions({customOption: 'four'})}).toThrow()
            expect( ()=> {oc2.getCleanOptions({customOption: 1})}).not.toThrow()
            expect( ()=> {oc2.getCleanOptions({customOption: 'one'})}).not.toThrow()
        })

        it ('should apply transform functions', () => {
            let oc = new OptionsChecker({
                context: 'Transform Function Test',
                optionsDefinition: {
                    option1 : { type: 'string', transformFunction: (str) => { return str.toLowerCase()}, default: 'd'},
                    option2: { type: 'number', transformFunction: (n) => { return n*n}, default: 2}
                }
            })
            expect(oc.getCleanOptions({})).toEqual({option1: 'd', option2: 2})
            expect(oc.getCleanOptions({option1: 'Hello', option2: 5})).toEqual({option1: 'hello', option2: 25})
        })

        it('should throw an error on undefined default for non-valid options',  ()=> {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option1 : { type: 'number'},
                },
                context: 'Undefined Default Test'
            })
            expect(() => {oc.getCleanOptions({ option1: 'someString' })}).toThrow()
        })

        it ('should deal with object classes', () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    option1 : { type: 'object', objectClass: Date }
                },
                context: 'Object Classes Test'
            })
            let d = oc.getCleanOptions({ option1: new Date()})
            expect(d.option1).toBeDefined()
            expect(d.option1 instanceof Date).toBeTrue()
            expect(() => {oc.getCleanOptions({ option1: String('test')})}).toThrow()

            let oc2 = new OptionsChecker({
                optionsDefinition: {
                    id: {
                        type: 'number',
                        default: -1
                    },
                    user: {
                        type: 'object',
                        objectDefinition: {
                            name: { type: 'string', required: true},
                            age: { type: 'number', required: true},
                            address: { type: 'string', default: 'N/A'}
                        }
                    }
                },
                context: 'Object Definition Test'
            })
            let d2 = oc2.getCleanOptions({ user: { name: 'Rafael', age: 50}})
            expect(d2.id).toBe(-1)
            expect(d2.user).toEqual({name: 'Rafael', age: 50, address: 'N/A'})

        })

        it (`should deal with arrays`, () => {
            let oc = new OptionsChecker({
                optionsDefinition: {
                    users: { type: 'array', minLength: 1}
                },
                context: 'Array Length Test 1'
            })
            expect(() => {oc.getCleanOptions({ users: []})}).toThrow()
            expect(() => {oc.getCleanOptions({ users: [1, 2, 3]})}).not.toThrow()

            oc = new OptionsChecker({
                optionsDefinition: {
                    users: { type: 'array', maxLength: 3}
                },
                context:'Array Length Test 2'
            })
            expect(() => {oc.getCleanOptions({ users: [1, 2, 3, 4]})}).toThrow()
            expect(() => {oc.getCleanOptions({ users: [1, 2, 3]})}).not.toThrow()

            oc = new OptionsChecker({
                optionsDefinition:{
                    users: { type: 'array', minLength: 1,  maxLength: 3}
                },
                context: 'Array Length Test 3'
            })
            expect(() => {oc.getCleanOptions({ users: []})}).toThrow()
            expect(() => {oc.getCleanOptions({ users: [1, 2, 3, 4]})}).toThrow()
            expect(() => {oc.getCleanOptions({ users: [1, 2, 3]})}).not.toThrow()

            oc = new OptionsChecker({
                optionsDefinition: {
                    name: {
                        type: 'string',
                        default: 'Store'
                    },
                    items: {
                        type: 'array',
                        minLength: 1,
                        elementDefinition: { type: 'string'}
                    }
                },
                context: 'Array Element Definition Test',
                strictDefault: true
            })
            expect(() => {oc.getCleanOptions({ items: []})}).toThrow()
            expect(() => {oc.getCleanOptions({ items: [true, 'banana']})}).toThrow()
            expect(() => {oc.getCleanOptions({ items: ['soap', 'meat', 3]})}).toThrow()
            expect(() => {oc.getCleanOptions({ name: 'Good Store', items: ['soap', 'meat', 'apples']})}).not.toThrow()
        })

        it("should enforce strict defaults", () => {
            let oc = new OptionsChecker( {
                optionsDefinition: {
                    option1: { type: 'number', min: 0, max: 20, default: 1}
                },
                context: 'Strict Default Test',
                strictDefault: true,
                verbose: false
            })
            expect(oc.getCleanOptions({}).option1).toBe(1)
            expect(oc.getCleanOptions({option1: 10}).option1).toBe(10)
            expect(() => {oc.getCleanOptions({ option1: -1 })}).toThrow()
            expect(() => {oc.getCleanOptions({ option1: 25 })}).toThrow()
        })

    })
})