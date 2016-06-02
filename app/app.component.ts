import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import './rxjs-operators';

import { PaperComponent } from './paper.component';
import { ConfigurationComponent } from './configuration.component';

@Component({
    selector: 'my-app',
    template: `
    <router-outlet></router-outlet>
    <h2>{{title}} v{{version}} | <a [routerLink]="['Configuration']">Configuration </a>&nbsp;&nbsp;<a [routerLink]="['Paper']">Paper</a></h2>
    `,
     styles: [`
         h2 {font-size:small;} 
         .router-link-active { display: none; width: 3em; }
     `],
    directives: [  ROUTER_DIRECTIVES ],
    providers: [ ROUTER_PROVIDERS ]
})

@RouteConfig([
    {
        path: "/",          
        name: "root",      
        redirectTo: [ "Paper"] },
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
    version = '0.1';
}

