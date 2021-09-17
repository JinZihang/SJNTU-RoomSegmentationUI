import { Component, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'room-segmentation-line',
  templateUrl: './room-seg-line.component.html',
  styleUrls: ['./room-seg-line.component.css']
})
export class RoomSegLineComponent implements AfterViewInit {
  @Input() linesets: any;
  @Input() extendedLinesets: any;

  @ViewChild('line') lineElement: ElementRef;

  extremities: any = [];

  ngAfterViewInit() {}

  public showExtremities(elementIndex: number): void {
    this.extremities = elementIndex !== -1 ? this.linesets[elementIndex] : [];
  }

  public moveSegLine(elementIndex: number): void {
    let strToPrint = 'moveSegLine(' + String(elementIndex) + ')';
    console.log(strToPrint);
  }
}