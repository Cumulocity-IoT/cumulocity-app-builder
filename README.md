# Application Builder for Cumulocity
The Application Builder for Cumulocity provides a simple, coding-free way to create new applications inside Cumulocity. 
Application Builder is an open-source tool for you to create web applications in a no-code environment. It's being managed by the Software AG's open source community but not officially supported by Software AG. You can log any issues at [GitHub](https://github.com/SoftwareAG/cumulocity-app-builder/issues) or  ask any question on the Software AG Tech Community. Support will provided on best endeavors.

![](https://user-images.githubusercontent.com/38696279/72333172-47cec300-36b3-11ea-9abf-1bb29b490a22.png)

## What's new?
* **Widget Catalog:** Now user has ability to install/update runtime widgets directly from Widget Catalog. This is single place where user can also find widget details such as documentation, preview, license and author details.
* **Dashboard Catalog:** User can select any pre-designed template for dashboard and ability to install dependent runtime widgets.
* **Dashboard Catalog:** User can search various dashboards.
* **Cumulocity Version:** Based on Cumulocity 1010.0.8
* **Various bug fixes**

## Features
* **Browser-based Device Simulators:** Create device simulators that run directly in your browser.
* **DTDL Simulator:** User can now create simulator based on [DTDL](https://github.com/Azure/opendigitaltwins-dtdl/blob/master/DTDL/v2/dtdlv2.md)(Digital Twins Definition Language).
* **Group Simulator:** User can create simulator for existing device group or new device group.
* **[Runtime widget loading](https://github.com/SoftwareAG/cumulocity-runtime-widget-loader):** Install widgets without re-compiling.
* **Group template dashboards:** Give every device in a group an identical dashboard (but customized to the device).
* **Create an App with a custom contextPath:** Change the URL used to access a particular app.
* **Application Clone**: User can now clone existing application while creating new one.
* **GainSight Integration:** Gainsight is integrated with app builder and user can control it from settings page.
* **New Home Page:** New Home Page with quick start videos, help and support information.
* **Tabs:** Group your dashboards into tabs.

## Installation
**First Time:**
1. Grab the **[Latest Release Zip](https://github.com/SoftwareAG/cumulocity-app-builder/releases)**
2. Go to the **Administration view** in your tenant (/apps/administration)
3. Open the **Own applications** section in the navigator
4. Click **Add application**
5. Select **Upload web application**
6. Select the Zip you downloaded earlier

**Incremental Upgrade:**
1. Grab the **[Latest Release Zip](https://github.com/SoftwareAG/cumulocity-app-builder/releases)**
2. Go to the **Administration view** in your tenant (/apps/administration)
3. Open the **Own applications** section in the navigator
4. Click **Application Builder**
5. Click **Archives**
6. Click **Upload Archive**
7. Select the Zip you downloaded earlier

## Build Instructions
**Note:** It is only necessary to follow these instructions if you are modifying/extending the Application Builder (such as adding custom widgets, branding, etc.), otherwise see the [Installation Guide](#Installation).

**Requirements:**
* Git
* NodeJS (release builds are currently built with `v16.9.1`)
* NPM (Included with NodeJS)

**Instructions**
1. Clone the repository: 
```
git clone https://github.com/SoftwareAG/cumulocity-app-builder.git
```
2. Change directory: 
```
cd cumulocity-app-builder
```
2. (Optional) Checkout a specific version: 
```
git checkout v1.2.7
```
3. Install the dependencies: 
```
npm install
```
4. (Optional) Local development server: 
```
npm start
```
5. Build the app: 
```
npm run build
```
6. Deploy the app: 
```
npm run deploy
```

## QuickStart

This guide will teach you how to create your first application using the Application Builder.

**NOTE:** This guide assumes you have followed the [Installation instructions](#Installation)

1. Open the Application Builder from the app switcher (Next to your username in the top right)
2. Click `Add application`
3. Enter the application details and click `Save`
4. Select `Add dashboard`
5. Click `Blank Dashboard`
6. Enter the dashboard details and click `Save`
7. Select the dashboard from the navigation

Congratulations! You have created an application and added your first screen.

## User Guide
A more detailed user guide and quick start videos are available in the Home section of the Application Builder app.

**NOTE:** This is only shown in the main page of the Application Builder, not when editing an individual application

## Runtime Widgets

Application Builder supports runtime widgets deployment. Some of the runtime widgets are already available in widget catalog.
You can find runtime widgets at [Software AG Open Source](https://open-source.softwareag.com/iot-analytics?search=runtime&topic=cumulocity-iot&repository=widget)

Would you like to create your own Custom Runtime widget? Please refer our [Demo Widget](https://github.com/SoftwareAG/cumulocity-demo-widget).


## Troubleshooting
 *  **Application Builder keep loading:** 
  If you are building your own version of app builder you may experience below error in browser console due to nv.d3.js bug.
  ```
  Uncaught (in promise) TypeError: true is not a function
    at eval (nv.d3.js?4bd4:9)
    at eval (nv.d3.js?4bd4:14365)
  ```
  If you encounter above error, please follow below steps:
  
   1. Stop the server.
   2. Goto /cumulocity_app_builder/node_modules/nvd3 folder
   3. Open nv.d3.js file
   4. add ";" at line number 7. Refer below code snippet.
    
    ```
      (function(){

      var nv = window.nv || {};


      nv.version = '1.1.15b';
      nv.dev = true; //set false when in production

      window.nv = nv;
    
    ```
   5. Save file
   6. Goto /cumulocity_app_builder/patches 
   7. Delete nvd3+0.0.1.patch file
   8. Goto /cumulocity_app_builder 
   9. Execute "npx patch-package nvd3" command in your terminal
   10. Start the server

------------------------------
## Contributing to Application Builder

If you like to submit a pull request,  please follow below guidelines:


#### Guidelines
- Please describe the changes that you are making
- For features, please describe how to use the new feature
- please include a reference to an existing issue, if applicable
- Specify type of change
	- Bug Fix
	- Feature
	- Other(Refactoring, Documentation, etc..)
- Does this change Introduce any breaking change ? Yes/No
- Follow below checklist:
	- Commit Messages follow the pattern
		- A feature commit message is prefixed "feature:"
		- A bugfix commit message is prefixed "fix:"
	-   Tests for the changes have been added


------------------------------

These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.
_____________________
For more information you can Ask a Question in the [TECH Community Forums](https://tech.forums.softwareag.com/tag/Cumulocity-IoT).
