# Collada 3D Widget

A ThreeJS based 3d viewer for Collada files in Cumulocity.

![Robotic Arm](img/arm.gif)
![Wind Turbine](img/turbine.gif)

## Installation

In Cumulocity, custom widgets are not deployed separately but as part of a larger application. 
These applications are created via the Cumulocity SDK and uploaded to a tenant. 

The SDK provides templates for the builtin applications (Cockpit, Device Management etc) to allow those to also be extended. 

This installation guide assumes that you have experience deploying a Cumulocity application.

### For use with the [Cumulocity Web SDK for Angular](http://cumulocity.com/guides/web/angular)

1. Open a terminal in the root of your Cumulocity application. 
2. Run: 
```
npm install --save SoftwareAG/cumulocity-collada-3d-widget
```
3. Add the following to the bottom of your [`ng1.ts`](http://cumulocity.com/guides/web/angular) file: 
```javascript
import 'collada-widget';
```
4. Edit the package.json in your Cumulocity application to allow blobs (The browser representation of the 3d model file) to be downloaded, by adding `blob:` to the `default-src` in the `contentSecurityPolicy` section:
```javascript
{
  "c8y": {
    "application": {
      ...
      "contentSecurityPolicy": "default-src 'self' 'unsafe-inline' http: https: ws: wss: blob:; ..."
    },
    ...
  }
}

```

### For use with the [Cumulocity Web SDK for Plugins](http://cumulocity.com/guides/web/web-sdk-for-plugins)

The recommended approach is to use the [Cumulocity Web SDK for Angular](http://cumulocity.com/guides/web/angular), but these details are provided for reference.

1. Download the latest release from the [Releases Area](https://github.com/SoftwareAG/cumulocity-collada-3d-widget/releases)
2. Extract the `collada-widget` folder into your plugins folder
3. Add the widget to your application manifest (Change `myapplication` to the name of your application)
```
{
  (...)
  "imports": [
    (...)
    "myapplication/collada-widget"
  ]
}
```

## Configuration

### Basic Process
1. Select a device (or a group if you require data from multiple devices)
2. Upload a Collada file
3. Use the Variables section to select a specific device
4. Click configure... and select Last Measurement and select the appropriate measurement
5. Use the Properties section to select a property to make dynamic
6. Add the variable's name to the [expression field](#expression-syntax)

![config](img/config1.png)
![config](img/config2.png)

### Expression syntax
The expression field uses the [MathJS library](https://mathjs.org/) and this library support many standard maths [functions](https://mathjs.org/docs/reference/functions.html#arithmetic-functions) and [constants](https://mathjs.org/docs/reference/constants.html).

Some examples:

```
cos(deviceAngleInDeg * pi / 180) // Convert angle to radians and then take the cosine of it
```
```
max(min(deviceValue, 100), 0) // Clamp the value between 0 and 100
```

------------------------------

These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.
