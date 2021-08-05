const path = require('path');

module.exports = {
    entry: './OptionsChecker.js',
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'OptionsChecker.js',
        library: 'OptionsChecker',
        libraryTarget: "umd"
    },
};
