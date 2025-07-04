

export class OptionsChecker {

    constructor(constructorOptions: any, contextStr: string|null, verbose);
    setDebug(debug: boolean): void;
    getCleanOptions(optionsObject: any): any;
    getDefaults(): any;
}