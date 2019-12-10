import './polyfills';
import './ng1';

import './node_modules/marked/lib/marked.js'

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

declare const __MODE__: string;
if (__MODE__ === 'production') {
  enableProdMode();
}

export function bootstrap() {
  return platformBrowserDynamic()
    .bootstrapModule(AppModule).catch((err) => console.log(err));
}
