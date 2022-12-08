const webpack = require("webpack");
const path = require('path');

module.exports =  {
   
       output: {
            globalObject: "self"
        },
        module: {
           /*  rules: [
                {
                    test: /\.html$/,
                    loader: 'raw-loader',
                    exclude: /node_modules/,
                    include: [
                        path.resolve(__dirname, 'builder/application/alarms'),
                        path.resolve(__dirname, 'builder/application/dataexplorer'),
                        path.resolve(__dirname, 'builder/application/smartrules'),
                    ]
                      
                }
            ] */
        },
        plugins: [
           new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(require('./package').version),
            })
        ]
    }
;
