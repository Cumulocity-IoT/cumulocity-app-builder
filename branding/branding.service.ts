import {Injectable} from "@angular/core";
import * as fa from "fontawesome";
import * as d3 from "d3-color";

@Injectable()
export class BrandingService {
    appGeneral: HTMLStyleElement;
    appBranding: HTMLStyleElement;
    favicon: HTMLLinkElement;

    constructor() {
        this.appGeneral = document.createElement('style');
        this.appBranding = document.createElement('style');
        document.head.appendChild(this.appGeneral);
        document.head.appendChild(this.appBranding);

        this.favicon = document.head.querySelector('[rel=icon]');
    }

    updateStyleForApp(app) {
        if (app && app.applicationBuilder) {
            this.appGeneral.innerText = `
.title .c8y-app-icon i {
    display: none;
}
.title .c8y-app-icon {
    margin-top: -16px;
}
.title .c8y-app-icon::before {
    font-family: "FontAwesome";
    content: "${fa(app.applicationBuilder.icon)}";
    font-size: ${app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.hideIcon ? '0' : 'var(--navigator-app-icon-size, 46px)'};
}
.title .c8y-app-icon::after {
    content: '${CSS.escape(app.name)}';
    display: block;
    margin-top: -6px;
    padding-left: 5px;
    padding-right: 5px;
    white-space: pre-wrap;
}
.title span {
    display: none;
}

.app-main-header .app-view::before {
  font-family: "FontAwesome";
  content: "${fa(app.applicationBuilder.icon)}";
  font-size: 2em;
  width: 32px;
  transform: scale(1);
  margin-left: 0.5em;
  transition: all .4s ease-in-out;
}
.app-main-header.open .app-view::before {
  width: 0;
  transform: scale(0);
  margin-left: 0;
}
.app-main-header .app-view c8y-app-icon  {
  display: none;
}

.navigatorContent .link.active {
    border-left-color: var(--navigator-active-color);
}
`;

            if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.colors) {
                const faviconUrl = this.createFaviconUrl(app.applicationBuilder.branding.colors.primary, app.applicationBuilder.icon);
                this.favicon.setAttribute('type', 'image/png');
                this.favicon.setAttribute('href', faviconUrl);

                this.appBranding.innerText = `
body {
    /* Navigator color: */
    --brand-primary: ${this.colorToHex(app.applicationBuilder.branding.colors.primary)};
    --brand-light: ${this.lighter(app.applicationBuilder.branding.colors.primary)};
    --navigator-active-bg: ${this.colorToHex(app.applicationBuilder.branding.colors.active)};
    
    /* Navigator text: */
    --navigator-text-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnPrimary)};
    --navigator-title-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnPrimary)};
    --navigator-active-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnActive)};
    
    /* All the other text: */
    --brand-dark: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --input-focus-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};

    ${app.applicationBuilder.branding.logoHeight != undefined ? '--navigator-platform-logo-height: ' + app.applicationBuilder.branding.logoHeight + 'px;' : ''}
}

.navigator .title .tenant-brand {
    background-image: url(${CSS.escape(app.applicationBuilder.branding.logo || '')});
}

.title .c8y-app-icon {
    ${app.applicationBuilder.branding.logoHeight != undefined ? '': 'margin-top: -16px;'}
}

.btn.btn-primary {
    color: ${this.primaryButtonTextColor(app.applicationBuilder.branding.colors.primary)};
}
`;
            } else {
                const faviconUrl = this.createFaviconUrl('#1776BF', app.applicationBuilder.icon);
                this.favicon.setAttribute('type', 'image/png');
                this.favicon.setAttribute('href', faviconUrl);

                this.appBranding.innerText = '';
            }
        } else {
            this.favicon.removeAttribute('type');
            this.favicon.setAttribute('href', 'favicon.ico');

            this.appGeneral.innerText = `
.title span::after {
    content: "V${__VERSION__}";
    display: block;
    font-size: small;
}
`;
            this.appBranding.innerText = '';
        }
    }

    colorToHex(color: string): string {
        try {
            return d3.color(color).hex();
        } catch(e) {
            return 'white'
        }
    }

    lighter(color: string): string {
        try {
            return d3.color(color).brighter().hex()
        } catch(e) {
            return 'white'
        }
    }

    primaryButtonTextColor(primaryColor: string): string {
        try {
            const color = d3.color(primaryColor).rgb();
            // Formula from Gacek: https://stackoverflow.com/a/1855903/11530669
            return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255 > 0.5 ? 'black' : 'white';
        } catch(e) {
            return 'white';
        }
    }

    createFaviconUrl(primaryColor: string, icon: string): string {
        const color = this.colorToHex(primaryColor);
        const canvas = document.createElement('canvas');
        canvas.height = 16;
        canvas.width = 16;
        const context = canvas.getContext('2d');
        context.font = '16px FontAwesome';
        context.textBaseline = 'top';
        context.textAlign = 'left';
        context.fillStyle = color;
        context.fillText(fa(icon), 0, 0, 16);
        return canvas.toDataURL();
    }
}