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
     //   webworker: './builder/simulator/worker/worker.ts'
    },
        module: {
            rules: [
                {
                    test: /\.(js|ts)$/,
                    use: {
                      loader: 'babel-loader',
                      options: {
                        plugins: ['@angular/compiler-cli/linker/babel'],
                        compact: false,
                        cacheDirectory: true,
                      }
                    }
                  },
                {
                    test: /\.[jt]sx?$/,
                    loader: '@ngtools/webpack',
                  },
                /* {
                    test:  /(\/|\\)worker\.ts/,
                    loader: 'ts-loader',
                   
                }, */
                   /*  {
                        test: /(\/|\\)simulator-worker-index-([0-9]|[a-z])*\.ts?$/,
                        loader: 'babel-loader',
                        exclude: /node_modules/
                    }, */
        /*         {test: /(\/|\\)simulator-worker-index-([0-9]|[a-z])*\.ts$/, loader: 'worker-loader'},
                {test: /(\/|\\)simulator-worker-index-([0-9]|[a-z])*\.ts$/, loader: 'ts-loader'}, */
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
            /* new WorkerPlugin({
                plugins: [  new AngularWebpackPlugin ({
                    tsConfigPath: './tsconfig.json',
                    entryModule: './builder/simulator/worker/simulator-worker.module#SimulatorWorkerModule',
                    sourceMap: true
                }), 'CumulocityPlugin']
            }), */
            new AngularWebpackPlugin ({
                tsConfigPath: './tsconfig.json',
                entryModule: './builder/simulator/worker/simulator-worker.module#SimulatorWorkerModule',
                sourceMap: true
            }),
            new ModuleFederationPlugin({
                shared: {
                  '@angular/core/': { singleton: true, eager: true },
                }
            })
        ]
    }
;
