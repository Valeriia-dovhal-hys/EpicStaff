import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { provideHttpClient } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { ConfigService } from './services/config/config.service';

// A factory function for APP_INITIALIZER
export function initializeApp(configService: ConfigService) {
  // Return a function that returns a promise.
  // Angular will wait for this promise before bootstrapping the app.
  return () => configService.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),

    provideHttpClient(),
    importProvidersFrom(
      MarkdownModule.forRoot({}),
      MonacoEditorModule.forRoot()
    ),

    // IMPORTANT: Provide APP_INITIALIZER to load the config before the app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
  ],
};
