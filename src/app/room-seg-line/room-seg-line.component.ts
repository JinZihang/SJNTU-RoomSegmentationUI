import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild, Renderer2 } from '@angular/core';

@Component({
  selector: 'room-segmentation-line',
  templateUrl: './room-seg-line.component.html',
  styleUrls: ['./room-seg-line.component.css']
})
export class RoomSegLineComponent implements AfterViewInit {
  @Input() linesets: any;
  @Input() imageDim: any;

  constructor() {}

  ngAfterViewInit() {}
}