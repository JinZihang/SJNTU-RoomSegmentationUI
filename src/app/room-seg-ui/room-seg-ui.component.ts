import { Component, AfterViewInit, ViewChild, ElementRef, Renderer2, Inject } from '@angular/core';
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
  
  // @Input(): imgSrc & lineset
  imgSrc: string = '/assets/mock-image-2.png';
  imgScale: number[];

  lineSet: number[][] = linesetData;
  lineSetExtended: number[][];
  lineSetToggle: boolean = false;
  lineSetToDisplay: number[][] = this.lineSet;

  @ViewChild('resizeContainer') resizeContainer: ElementRef;
  @ViewChild('actionButtonContainer') actionButtonContainer: ElementRef;
  @ViewChild('processButtonContainer') processButtonContainer: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  ngAfterViewInit() {
    this.setContainerPosition();
  }

  private setContainerPosition() {
    this.renderer.setStyle(this.resizeContainer.nativeElement, 'height', String(this.canvasSideLength) + 'px');
    this.renderer.setStyle(this.resizeContainer.nativeElement, 'width', String(this.canvasSideLength) + 'px');

    this.renderer.setStyle(this.actionButtonContainer.nativeElement, 'left', String(this.canvasSideLength + 30) + 'px');

    this.renderer.setStyle(this.processButtonContainer.nativeElement, 'top', String(this.canvasSideLength - 66) + 'px');
    this.renderer.setStyle(this.processButtonContainer.nativeElement, 'left', String(this.canvasSideLength + 30) + 'px');
  }

  public getRoomImgScale(imgScale: any) {
    this.imgScale = imgScale;
    this.extendLineSet();
  }

  private extendLineSet() {
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

  public toggleBetweenLineSegmentAndLine() {
    this.lineSetToggle = !this.lineSetToggle;
    this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
  }
}