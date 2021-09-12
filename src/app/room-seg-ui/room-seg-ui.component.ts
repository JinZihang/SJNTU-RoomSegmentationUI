import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import linesetData from '../../assets/mock-lineset.json';

@Component({
  selector: 'room-segmentation-ui',
  templateUrl: './room-seg-ui.component.html',
  styleUrls: ['./room-seg-ui.component.css']
})
export class RoomSegUIComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  // Change to @Input after completing the UI
  imageSrc = '/assets/mock-image.png';
  linesets = linesetData.Linesets;

  // imageDimensions = ;

  segAdd(): void {}

  segRemove(): void {}

  segConfirm(): void {}
}

