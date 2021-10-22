const webpack = require("webpack");
const WorkerPlugin = require('worker-plugin');
const URLImportPlugin  = require("webpack-external-import/webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = function config() {
    return {
       output: {
            globalObject: "self"
        },
        plugins: [
            new CopyWebpackPlugin(
            {
                patterns: [
                   {
                      from: "./ui-assets/fonts",
                      to: "./fonts/",
                }],
            }),
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(require('./package').version),
                /* Required to be able to run the @c8y/Client inside a Worker */
                window: '(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : commonjsGlobal)'
            }),
            new WorkerPlugin({
                plugins: ['AngularCompilerPlugin', 'CumulocityPlugin']
            }),
            new URLImportPlugin ({
                manifestName: "app",
                provideExternals: {
                    "@angular/animations": "AngularAnimations",
                    "@angular/common": "AngularCommon",
                    "@angular/common/http": "AngularCommonHttp",
                    "@angular/cdk": "AngularCdk",
                    "@angular/core": "AngularCore",
                    "@angular/forms": "AngularForms",
                    "@angular/http": "AngularHttp",
                    "@angular/platform-browser": "AngularPlatformBrowser",
                    "@angular/platform-browser/animations": "AngularPlatformBrowserAnimations",
                    "@angular/router": "AngularRouter",
                    "@c8y/client": "C8yClient",
                    "@c8y/ngx-components": "C8yNgxComponents"
                }
            })
        ]
    }
};
