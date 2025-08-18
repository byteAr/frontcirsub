import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
  interface Window {
    __bipEvent?: BeforeInstallPromptEvent | null;
    __bipSubscribers?: Array<(e: BeforeInstallPromptEvent) => void>;
  }
}


window.__bipSubscribers = [];
window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  const bip = e as BeforeInstallPromptEvent;
  window.__bipEvent = bip;

  window.__bipSubscribers!.forEach(fn => fn(bip));
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
