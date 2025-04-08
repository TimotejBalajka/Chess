import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DashboardComponent } from './app/dashboard/dashboard.component';
import { JwtModule } from '@auth0/angular-jwt';
import { VsPcComponent } from './app/vs-pc/vs-pc.component';
import { MainPageComponent } from './app/main-page/main-page.component';



export function getBaseUrl() {
  //return 'https://localhost:7186/api';
  return 'https://Balajka.bsite.net/api';
}

export function tokenGetter() {
  return localStorage.getItem("token");
}

const providers = [
  { provide: 'BASE_URL', useFactory: getBaseUrl, deps: [] }
];

bootstrapApplication(AppComponent, {
    providers: [
      providers,
      importProvidersFrom(BrowserModule, JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: [/*'https://localhost:7186',*/ 'https://Balajka.bsite.net/api'],
          disallowedRoutes: [],
        },
      })),
      provideAnimations(),
      provideHttpClient(withInterceptors([])),
    provideRouter([
        { path: '', component: MainPageComponent },
        { path: 'VsPlayer', component: DashboardComponent },
        { path: 'VsPC', component: VsPcComponent },
      ])
    ]
})
  .catch(err => console.error(err));
