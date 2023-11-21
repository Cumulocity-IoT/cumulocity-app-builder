const webpack = require("webpack");
const path = require('path');

module.exports =  {
   
       output: {
            globalObject: "self"
        },
        module: {
        },
        plugins: [
           new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(require('./package').version),
            })
        ]
    }
;
