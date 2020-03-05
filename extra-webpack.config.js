const webpack = require("webpack");
const WorkerPlugin = require('worker-plugin');

module.exports = function config(env) {
    return {
        output: {
            globalObject: "self"
        },
        plugins: [
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(require('./package').version),
                /* Required to be able to run the @c8y/Client inside a Worker */
                window: '(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : commonjsGlobal)'
            }),
            new WorkerPlugin({
                plugins: ['AngularCompilerPlugin', 'CumulocityPlugin']
            })
        ]
    }
};
