import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import './rxjs-operators';

import { PaperComponent } from './paper.component';
import { ConfigurationComponent } from './configuration.component';

@Component({
    selector: 'my-app',
    template: `
    <h2>{{title}} v{{version}} | <a [routerLink]="['Configuration']">Configuration</a> | <a [routerLink]="['Paper']">Paper</a></h2>
    <router-outlet></router-outlet>
    `,
    styles: [`h2 {font-size:smaller;} `],
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
    title = 'Maths Scribe';
    version = '0.0';
}

