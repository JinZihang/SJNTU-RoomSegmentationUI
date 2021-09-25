import { Component, AfterViewInit, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'room-seg-display',
  templateUrl: 'room-seg-display.component.html',
  styleUrls: ['room-seg-display.component.css']
})
export class RoomSegDisplayComponent implements AfterViewInit {
  @Input() canvasSideLength: number;
  @Input() imgSrc: string;
  @Input() lineSet: number[][];

  @Output() roomImgScale = new EventEmitter<number[]>();

  imageScale: number; // Horizontal > 1
  canvasXMax: number;
  canvasYMax: number;

  showCursorCoor: boolean;
  cursorCoor: number[] = [-1, -1];

  @ViewChild('scaleContainer') scaleElement: ElementRef;
  @ViewChild('roomTopViewImage') imgElement: ElementRef;
  @ViewChild('cursorCoorContainer') cursorCoorElement: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  ngAfterViewInit() {}

  public roomTopViewImgOnLoad(): void {
    this.setScaleContainerDimension();
  }

  // Initialize scale container and adjust coordinates according to the original image scale.
  private setScaleContainerDimension(): void {
    let imgNaturalWidth = (this.imgElement.nativeElement as HTMLImageElement).naturalWidth;
    let imgNaturalHeight = (this.imgElement.nativeElement as HTMLImageElement).naturalHeight;
    this.imageScale = imgNaturalWidth/imgNaturalHeight;

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

    this.adjustLinesetCoordinates(imgNaturalWidth, imgNaturalHeight);
    this.setCursorCoordinatesContainerPosition();

    this.roomImgScale.emit([imgNaturalWidth, imgNaturalHeight]);
  }
  private adjustLinesetCoordinates(imgNaturalWidth: number, imgNaturalHeight: number): void {
    for (let i=0; i<this.lineSet.length; i++) {
      this.lineSet[i][0] = (this.lineSet[i][0] / imgNaturalWidth) * this.canvasXMax;
      this.lineSet[i][1] = (this.lineSet[i][1] / imgNaturalHeight) * this.canvasYMax;
      this.lineSet[i][2] = (this.lineSet[i][2] / imgNaturalWidth) * this.canvasXMax;
      this.lineSet[i][3] = (this.lineSet[i][3] / imgNaturalHeight) * this.canvasYMax;
    }
  }

  // Cursor coordinates related.
  private setCursorCoordinatesContainerPosition() {
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
}