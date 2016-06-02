import { Component, OnInit } from '@angular/core';
import {NgGrid, NgGridItem} from 'angular2-grid';
@Component({
  selector: 'my-configuration',
  templateUrl: 'app/config.component.html',
  directives: [  NgGrid, NgGridItem ],
})
export class ConfigurationComponent implements OnInit {
    ngOnInit() { }
}
