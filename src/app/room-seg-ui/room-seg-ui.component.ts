import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from "@angular/common";
import { fromEvent } from "rxjs";
import { filter, take, takeWhile } from "rxjs/operators";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import linesetData from '../../assets/mock-lineset-2.json';
import { RoomSegDisplayComponent } from './room-seg-display/room-seg-display.component'
import { RoomSegDialog } from './room-seg-dialog/room-seg-dialog.component'

@Component({
  selector: 'room-seg-ui',
  templateUrl: 'room-seg-ui.component.html',
  styleUrls: ['room-seg-ui.component.css']
})
export class RoomSegUIComponent implements AfterViewInit {
  canvasSideLength: number = 600;
  beforeResizeCanvasSideLength: number;
  resizeProcess: boolean = false;
  beforeResizeCursorPositionX: number;
  beforeResizeCursorPositionY: number;
  
  // @Input(): imgSrc & lineset
  imgSrc: string = '/assets/mock-image-2.png';
  imgScale: number[];

  lineSet: number[][] = linesetData;
  lineSetExtended: number[][];
  lineSetToggle: boolean = false;
  lineSetToDisplay: number[][] = this.lineSet;

  @ViewChild('resizeContainerElement') resizeContainerElement: ElementRef;
  @ViewChild('displayElement') displayElement: ElementRef;
  @ViewChild('actionButtonContainerElement') actionButtonContainerElement: ElementRef;
  @ViewChild('processButtonContainerElement') processButtonContainerElement: ElementRef;

  constructor(@Inject(DOCUMENT) private document: Document, private renderer: Renderer2, public dialog: MatDialog) {}

  // Initialize.
  ngAfterViewInit(): void {
    this.setContainerPosition();
  }
  private setContainerPosition(): void {
    this.renderer.setStyle(this.resizeContainerElement.nativeElement, 'height', String(this.canvasSideLength) + 'px');
    this.renderer.setStyle(this.resizeContainerElement.nativeElement, 'width', String(this.canvasSideLength) + 'px');

    this.renderer.setStyle(this.actionButtonContainerElement.nativeElement, 'left', String(this.canvasSideLength + 30) + 'px');

    this.renderer.setStyle(this.processButtonContainerElement.nativeElement, 'top', String(this.canvasSideLength - 66) + 'px');
    this.renderer.setStyle(this.processButtonContainerElement.nativeElement, 'left', String(this.canvasSideLength + 30) + 'px');
  }

  // For resizing the area to display image and line set.
  public resizeContainerControl(event: any, resizeProcess: boolean): void {
    this.resizeProcess = resizeProcess;

    this.beforeResizeCanvasSideLength = this.canvasSideLength;
    this.beforeResizeCursorPositionX = event.clientX;
    this.beforeResizeCursorPositionY = event.clientY;
  }
  public resizeContainer(event: any, direction: string): void {
    const minCanvasSideLength = 300;
    const maxCanvasSideLength = 700;

    if (this.resizeProcess) {
      if (this.canvasSideLength >= minCanvasSideLength && this.canvasSideLength <= maxCanvasSideLength) {
        switch (direction) {
          case 'bottom':
            this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientY - this.beforeResizeCursorPositionY);
            break;
          case 'right':
            this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientX - this.beforeResizeCursorPositionX);
            break;
        }
      } else if (this.canvasSideLength < minCanvasSideLength) {
        switch (direction) {
          case 'bottom':
            if (event.clientY - this.beforeResizeCursorPositionY > 0) {
              this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientY - this.beforeResizeCursorPositionY);
            }
            break;
          case 'right':
            if (event.clientX - this.beforeResizeCursorPositionX > 0) {
              this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientX - this.beforeResizeCursorPositionX);
            }
            break;
        }
      } else {
        switch (direction) {
          case 'bottom':
            if (event.clientY - this.beforeResizeCursorPositionY < 0) {
              this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientY - this.beforeResizeCursorPositionY);
            }
            break;
          case 'right':
            if (event.clientX - this.beforeResizeCursorPositionX < 0) {
              this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientX - this.beforeResizeCursorPositionX);
            }
            break;
        }
      }
      
      this.setContainerPosition();
    }
  }

  // For extending line segments to lines.
  public getRoomImgScale(imgScale: any): void {
    this.imgScale = imgScale;
    this.extendLineSet();
  }
  private extendLineSet(): void {
    this.lineSetExtended = [];
    let xMax = this.imgScale[0];
    let yMax = this.imgScale[1];

    for (let i=0; i<this.lineSet.length; i++) {
      // Equation of the line is 'y = (x-x1) * (y1-y2)/(x1-x2) + y1' ('x = (y-y1) * (x1-x2)/(y1-y2) + x1').
      let x1 = this.lineSet[i][0];
      let y1 = this.lineSet[i][1];
      let x2 = this.lineSet[i][2];
      let y2 = this.lineSet[i][3];
       
      if (x1 === x2) {
        this.lineSetExtended.push([x1, 0, x1, yMax]);
      } else {
        if (y1 === y2) {
          this.lineSetExtended.push([0, y1, xMax, y1]);
        } else {
          let yAtx0 = x1 * (y2-y1)/(x1-x2) + y1;
          let yAtxMax = (xMax-x1) * (y1-y2)/(x1-x2) + y1;
          let xAty0 = y1 * (x2-x1)/(y1-y2) + x1;
          let xAtyMax = (yMax-y1) * (x1-x2)/(y1-y2) + x1;

          if (yAtx0 < 0) {
            if (yAtxMax < 0) {
              console.warn('Check line ' + i + '.');
            } else if (yAtxMax > yMax) {
              this.lineSetExtended.push([xAty0, 0, xAtyMax, yMax]);
            } else {
              this.lineSetExtended.push([xAty0, 0, xMax, yAtxMax]);
            }
          } else if (yAtx0 > yMax) {
            if (yAtxMax < 0) {
              this.lineSetExtended.push([xAtyMax, yMax, xAty0, 0]);
            } else if (yAtxMax > yMax) {
              console.warn('Check line ' + i + '.');
            } else {
              this.lineSetExtended.push([xAtyMax, yMax, xMax, yAtxMax]);
            }
          } else {
            if (yAtxMax < 0) {
              this.lineSetExtended.push([0, yAtx0, xAty0, 0]);
            } else if (yAtxMax > yMax) {
              this.lineSetExtended.push([0, yAtx0, xAtyMax, yMax]);
            } else {
              this.lineSetExtended.push([0, yAtx0, xMax, yAtxMax]);
            }
          }
        }
      }
    }
  }
  public toggleBetweenLineSegmentAndLine(): void {
    this.lineSetToggle = !this.lineSetToggle;
    this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
  }
}