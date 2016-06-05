import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import './rxjs-operators';

import { ArithmeticComponent } from './arithmetic.component';
import { ConfigurationComponent } from './configuration.component';
import { SketchComponent } from './sketch.component';

@Component({
    selector: 'my-app',
    template: `
    <router-outlet></router-outlet>
    <h2>{{title}} v{{version}} | 
                <a [routerLink]="['Configuration']">Configuration </a>
                &nbsp;&nbsp;
                <a [routerLink]="['Arithmetic']">Arithmetic</a>
                &nbsp;&nbsp;
                <a [routerLink]="['Sketch']">Sketch</a>
    </h2>
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
        redirectTo: [ "Arithmetic"] },
    {
        path: '/config',
        name: 'Configuration',
        component: ConfigurationComponent
    },
    {
        path: '/arithmetic',
        name: 'Arithmetic',
        component: ArithmeticComponent
    },
    {
        path: '/sketch',
        name: 'Sketch',
        component: SketchComponent
    }
  ])

export class AppComponent {
    title = 'Maths Scribe';
    version = '0.1';
}

