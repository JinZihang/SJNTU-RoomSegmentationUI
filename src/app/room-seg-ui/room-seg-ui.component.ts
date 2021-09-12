import { Component, AfterViewInit, OnInit, Input, Directive, ViewChild, ElementRef } from '@angular/core';
import linesetData from '../../assets/mock-lineset.json';

@Component({
  selector: 'room-segmentation-ui',
  templateUrl: './room-seg-ui.component.html',
  styleUrls: ['./room-seg-ui.component.css']
})
export class RoomSegUIComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  // ngAfterViewInit() {}

  // Change to @Input after completing the UI
  imageSrc = '/assets/mock-image.png';
  linesets = linesetData.Linesets;
  
  // Get the image dimensions
  imageDim = 1.5;
  
  segAdd(): void {}
  segRemove(): void {}
  segConfirm(): void {}
}

