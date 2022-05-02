const webpack = require("webpack");
const WorkerPlugin = require('worker-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
//const URLImportPlugin  = require("webpack-external-import/webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const  {AngularWebpackPlugin} =  require("@ngtools/webpack"); 

module.exports =  {
    entry: {
        bootstrap: '@c8y/cli/dist/app-bootstrap',
    },
        module: {
            rules: [
                {
                    test: /\.html$/i,
                    loader: "html-loader",
                },
            ]
        },
       output: {
            globalObject: "self"
        },
        resolve: {
            modules: ['node_modules'],
          },
        plugins: [
            new CopyWebpackPlugin(
            {
                patterns: [
                   {
                      from: "./ui-assets/fonts",
                      to: "./fonts/",
                   }
                ]
            }),
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(require('./package').version),
                /* Required to be able to run the @c8y/Client inside a Worker */
           //     window: '(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : commonjsGlobal)'
            }),
            new WorkerPlugin({
                preserveTypeModule: true,
                plugins: [  new AngularWebpackPlugin ({
                    tsConfigPath: './tsconfig.json',
                    entryModule: './builder/simulator/worker/simulator-worker.module#SimulatorWorkerModule',
                    sourceMap: true
                }), 'CumulocityPlugin']
            }),
            new ModuleFederationPlugin({
                shared: {
                  '@angular/core/': { singleton: true, eager: true }
                }
            })
        ],
        resolveLoader: {
            alias: {
              worker: 'worker-plugin/loader?esModule'
            }
          }
    }
;
