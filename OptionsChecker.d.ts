

export class OptionsChecker {

    constructor(constructorOptions: any, contextStr?: string|null, verbose? : boolean);
    setDebug(debug: boolean): void;
    getCleanOptions(optionsObject: any): any;
    getDefaults(): any;
}