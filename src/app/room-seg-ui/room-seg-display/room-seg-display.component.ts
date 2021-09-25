import { Component, AfterViewInit, OnChanges, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'room-seg-display',
  templateUrl: 'room-seg-display.component.html',
  styleUrls: ['room-seg-display.component.css']
})
export class RoomSegDisplayComponent implements AfterViewInit, OnChanges {
  @Input() canvasSideLength: number;
  @Input() imgSrc: string;
  @Input() lineSet: number[][];
  @Input() lineSetToDisplay: number[][];

  @Output() roomImgScale = new EventEmitter<number[]>();

  initialized: boolean = false;

  imageScale: number; // Horizontal > 1
  imgNaturalWidth: number;
  imgNaturalHeight: number;
  canvasXMax: number;
  canvasYMax: number;

  lineSetCopy: number[][];
  lineSetToDisplayCopy: number[][];

  showCursorCoor: boolean;
  cursorCoor: number[] = [-1, -1];

  extremities: number[] = [];

  @ViewChild('scaleContainerElement') scaleElement: ElementRef;
  @ViewChild('roomTopViewImageElement') imgElement: ElementRef;
  @ViewChild('cursorCoorContainerElement') cursorCoorElement: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  ngAfterViewInit(): void {}

  ngOnChanges(): void {
    if (this.initialized) {
      this.setScaleContainerDimension();
    }
  }

  // Initialize elements.
  public roomTopViewImgOnLoad(): void {
    this.lineSetCopy = JSON.parse(JSON.stringify(this.lineSet));
    this.lineSetToDisplayCopy = JSON.parse(JSON.stringify(this.lineSetToDisplay));

    this.setScaleContainerDimension();
    
    this.initialized = true;
  }
  private setScaleContainerDimension(): void {
    this.imgNaturalWidth = (this.imgElement.nativeElement as HTMLImageElement).naturalWidth;
    this.imgNaturalHeight = (this.imgElement.nativeElement as HTMLImageElement).naturalHeight;
    this.imageScale = this.imgNaturalWidth/this.imgNaturalHeight;

    if (this.imageScale > 1) {
      this.canvasXMax = this.canvasSideLength;
      this.canvasYMax = this.canvasSideLength/this.imageScale;

      let height = String(100/this.imageScale) + '%';
      let topMargin = String(0.5*(100 - 100/this.imageScale)) + '%';

      this.renderer.setStyle(this.scaleElement.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.scaleElement.nativeElement, 'height', height);
      this.renderer.setStyle(this.scaleElement.nativeElement, 'margin-top', topMargin);
    } else {
      this.canvasXMax = this.canvasSideLength*this.imageScale;
      this.canvasYMax = this.canvasSideLength;

      let width = String(100*this.imageScale) + '%';
      let topMargin = String(0.5*(100 - 100*this.imageScale)) + '%';

      this.renderer.setStyle(this.scaleElement.nativeElement, 'height', '100%');
      this.renderer.setStyle(this.scaleElement.nativeElement, 'width', width);
      this.renderer.setStyle(this.scaleElement.nativeElement, 'margin-left', topMargin);
    }

    this.adjustLinesetCoordinates();
    this.setCursorCoordinatesContainerPosition();

    this.roomImgScale.emit([this.imgNaturalWidth, this.imgNaturalHeight]);
  }
  private adjustLinesetCoordinates(): void {
    for (let i=0; i<this.lineSet.length; i++) {
      this.lineSetCopy[i][0] = (this.lineSet[i][0] / this.imgNaturalWidth) * this.canvasXMax;
      this.lineSetCopy[i][1] = (this.lineSet[i][1] / this.imgNaturalHeight) * this.canvasYMax;
      this.lineSetCopy[i][2] = (this.lineSet[i][2] / this.imgNaturalWidth) * this.canvasXMax;
      this.lineSetCopy[i][3] = (this.lineSet[i][3] / this.imgNaturalHeight) * this.canvasYMax;
    }

    for (let i=0; i<this.lineSetToDisplay.length; i++) {
      this.lineSetToDisplayCopy[i][0] = (this.lineSetToDisplay[i][0] / this.imgNaturalWidth) * this.canvasXMax;
      this.lineSetToDisplayCopy[i][1] = (this.lineSetToDisplay[i][1] / this.imgNaturalHeight) * this.canvasYMax;
      this.lineSetToDisplayCopy[i][2] = (this.lineSetToDisplay[i][2] / this.imgNaturalWidth) * this.canvasXMax;
      this.lineSetToDisplayCopy[i][3] = (this.lineSetToDisplay[i][3] / this.imgNaturalHeight) * this.canvasYMax;
    }
  }

  // Cursor coordinates related.
  private setCursorCoordinatesContainerPosition(): void {
    let top = String(this.canvasSideLength - 10) + 'px';
    let width = String(this.canvasSideLength) + 'px';

    this.renderer.setStyle(this.cursorCoorElement.nativeElement, 'top', top);
    this.renderer.setStyle(this.cursorCoorElement.nativeElement, 'width', width);
  }
  public showCursorCoordinates(show: boolean): void {
    this.showCursorCoor = show;
  }
  public updateCursorCoordinates(event: any): void {
    this.cursorCoor[0] = event.offsetX;
    this.cursorCoor[1] = event.offsetY;
  }

  public showExtremities(elementIndex: number): void {
    if (elementIndex === -1) {
      this.extremities = [];
    } else {
      this.extremities = this.lineSetCopy[elementIndex];
    }
  }
}