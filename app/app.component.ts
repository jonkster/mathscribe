import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { PaperComponent } from './paper.component';
import { ConfigurationComponent } from './configuration.component';

@Component({
    selector: 'my-app',
    template: `
    <h1>{{title}} v{{version}}</h1>
    <a [routerLink]="['Configuration']">Configuration</a>
    <a [routerLink]="['Paper']">Paper</a>
    <router-outlet></router-outlet>
    `,
    directives: [  ROUTER_DIRECTIVES ],
    providers: [ ROUTER_PROVIDERS ]
})

@RouteConfig([
    {
        path: '/config',
        name: 'Configuration',
        component: ConfigurationComponent
    },
    {
        path: '/paper',
        name: 'Paper',
        component: PaperComponent
    }
  ])

export class AppComponent {
    title = 'Math Scribe';
    version = '0.0';
}

