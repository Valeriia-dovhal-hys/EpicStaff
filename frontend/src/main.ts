// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Setup Monaco environment with webpack approach
(window as any).MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: string, label: string) {
    return './assets/monaco/min/vs/base/worker/workerMain.js';
  },
};
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
