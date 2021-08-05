const path = require('path');

module.exports = [
    {
        entry: './OptionsChecker.mjs',
        mode: 'production',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'OptionsChecker.min.js',
            library: {
                name: 'OptionsChecker',
                export: 'OptionsChecker',
                type: 'window'
            }
        }
    },
    {
        entry: './OptionsChecker.mjs',
        mode: 'none',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'OptionsChecker.js',
            library: {
                name: 'OptionsChecker',
                export: 'OptionsChecker',
                type: 'window'
            }
        }
    }]
