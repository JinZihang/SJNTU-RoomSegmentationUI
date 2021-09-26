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
  @Input() processInfo: any[];

  @Output() roomImgScale = new EventEmitter<number[]>();
  @Output() lineAddProcessControl = new EventEmitter<any[]>(); // Whether line extremities are complete, line to be added.
  @Output() editResult = new EventEmitter<any[]>(); // Action, line index.

  initialized: boolean = false;

  imageScale: number; // Horizontal > 1
  imgNaturalWidth: number;
  imgNaturalHeight: number;
  canvasXMax: number;
  canvasYMax: number;

  lineSetCopy: number[][];
  lineSetToDisplayCopy: number[][];
  lineToBeAdded: number[] = [-1, -1, -1, -1];
  lineToBeAddedOutput: number[] = [-1, -1, -1, -1];
  extremities: number[] = [];
  addLineProcessExtremities: number[][] = [[], []];

  showCursorCoor: boolean;
  cursorCoor: number[] = [-1, -1];

  @ViewChild('scaleContainerElement') scaleContainerElement: ElementRef;
  @ViewChild('roomTopViewImageElement') imgElement: ElementRef;
  @ViewChild('cursorCoorContainerElement') cursorCoorContainerElement: ElementRef;
  @ViewChild('coorInputContainer') coorInputContainerElement: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  ngAfterViewInit(): void {}

  ngOnChanges(): void {
    if (this.initialized) {
      this.lineSetCopy = JSON.parse(JSON.stringify(this.lineSet));
      this.lineSetToDisplayCopy = JSON.parse(JSON.stringify(this.lineSetToDisplay));

      this.setScaleContainerDimension();
    }

    if (this.processInfo[0] === '') {
      this.lineToBeAdded = [-1, -1, -1, -1];
      this.addLineProcessExtremities = [[], []];
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

      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'height', height);
      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'margin-top', topMargin);
    } else {
      this.canvasXMax = this.canvasSideLength*this.imageScale;
      this.canvasYMax = this.canvasSideLength;

      let width = String(100*this.imageScale) + '%';
      let topMargin = String(0.5*(100 - 100*this.imageScale)) + '%';

      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'height', '100%');
      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'width', width);
      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'margin-left', topMargin);
    }

    this.adjustLinesetCoordinates(false);
    this.setCursorCoordinatesContainerPosition();
    this.setCoordinatesInputContainerPosition();

    this.roomImgScale.emit([this.imgNaturalWidth, this.imgNaturalHeight]);
  }
  private adjustLinesetCoordinates(revert: boolean): void {
    if (!revert) { // Convert the input line set.
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
    } else { // Revert the output line's coordinates.
      this.lineToBeAddedOutput[0] = (this.lineToBeAdded[0] / this.canvasXMax) * this.imgNaturalWidth;
      this.lineToBeAddedOutput[1] = (this.lineToBeAdded[1] / this.canvasYMax) * this.imgNaturalHeight;
      this.lineToBeAddedOutput[2] = (this.lineToBeAdded[2] / this.canvasXMax) * this.imgNaturalWidth;
      this.lineToBeAddedOutput[3] = (this.lineToBeAdded[3] / this.canvasYMax) * this.imgNaturalHeight;
    }
  }

  // Line related functions.
  public lineClickAction(lineIndex: number): void {
    switch (this.processInfo[0]) {
      case 'remove':
        this.removeLine(lineIndex);
        break;
      default:
        this.editLine(lineIndex);
        break;
    }
  }
  private setCoordinatesInputContainerPosition(): void {
    let top = String(this.canvasSideLength + 35) + 'px';
    let width = String(this.canvasSideLength) + 'px';

    this.renderer.setStyle(this.coorInputContainerElement.nativeElement, 'top', top);
    this.renderer.setStyle(this.coorInputContainerElement.nativeElement, 'width', width);
  }
  public addLineProcessInputOnKey(placeHolder: string, value: any): void {
    switch (placeHolder) {
      case 'firstExtremX':
        if(value === '' || value < 0 || value > this.canvasXMax) {
          this.lineToBeAdded[0] = -1;
        } else {
          this.lineToBeAdded[0] = value;
        }
        break;
      case 'firstExtremY':
        if(value === '' || value < 0 || value > this.canvasXMax) {
          this.lineToBeAdded[1] = -1;
        } else {
          this.lineToBeAdded[1] = value;
        }
        break;
      case 'secondExtremX':
        if(value === '' || value < 0 || value > this.canvasXMax) {
          this.lineToBeAdded[2] = -1;
        } else {
          this.lineToBeAdded[2] = value;
        }
        break;
      case 'secondExtremY':
        if(value === '' || value < 0 || value > this.canvasXMax) {
          this.lineToBeAdded[3] = -1;
        } else {
          this.lineToBeAdded[3] = value;
        }
        break;
    }

    let lineToBeAddedIsComplete = false;
    this.addLineProcessExtremities = [[], []];
    
    if (this.lineToBeAdded[0] >= 0 && this.lineToBeAdded[0] <= this.canvasXMax
      && this.lineToBeAdded[1] >= 0 && this.lineToBeAdded[1] <= this.canvasYMax
      && this.lineToBeAdded[2] >= 0 && this.lineToBeAdded[2] <= this.canvasXMax
      && this.lineToBeAdded[3] >= 0 && this.lineToBeAdded[3] <= this.canvasYMax) { // Line complete.
      lineToBeAddedIsComplete = true;
      this.adjustLinesetCoordinates(true);

      this.addLineProcessExtremities[0].push(this.lineToBeAdded[0], this.lineToBeAdded[1]);
      this.addLineProcessExtremities[1].push(this.lineToBeAdded[2], this.lineToBeAdded[3]);
    } else if (this.lineToBeAdded[0] >= 0 && this.lineToBeAdded[0] <= this.canvasXMax 
      && this.lineToBeAdded[1] >= 0 && this.lineToBeAdded[1] <= this.canvasYMax) { // First extremity complete.
      this.addLineProcessExtremities[0].push(this.lineToBeAdded[0], this.lineToBeAdded[1]);
      this.lineToBeAddedOutput = [-1, -1, -1, -1];
    } else if (this.lineToBeAdded[2] >= 0 && this.lineToBeAdded[2] <= this.canvasXMax
      && this.lineToBeAdded[3] >= 0 && this.lineToBeAdded[3] <= this.canvasYMax) { // Second extermity complete.
      this.addLineProcessExtremities[1].push(this.lineToBeAdded[2], this.lineToBeAdded[3]);
      this.lineToBeAddedOutput = [-1, -1, -1, -1];
    }

    this.lineAddProcessControl.emit([lineToBeAddedIsComplete, this.lineToBeAddedOutput]);
  }
  public removeLine(lineIndex: number): void {
    this.extremities = [];
    this.lineSetToDisplayCopy = this.lineSetToDisplayCopy.filter(e => e !== this.lineSetToDisplayCopy[lineIndex]);

    this.editResult.emit(['remove', lineIndex]);
  }
  public editLine(lineIndex: number): void {
    console.log('edit line');
  }
  public showExtremities(lineIndex: number): void {
    if (lineIndex === -1) {
      this.extremities = [];
    } else {
      this.extremities = this.lineSetCopy[lineIndex];
    }
  }

  // Cursor coordinates related.
  private setCursorCoordinatesContainerPosition(): void {
    let top = String(this.canvasSideLength - 10) + 'px';
    let width = String(this.canvasSideLength) + 'px';

    this.renderer.setStyle(this.cursorCoorContainerElement.nativeElement, 'top', top);
    this.renderer.setStyle(this.cursorCoorContainerElement.nativeElement, 'width', width);
  }
  public showCursorCoordinates(show: boolean): void {
    this.showCursorCoor = show;
  }
  public updateCursorCoordinates(event: any): void {
    this.cursorCoor[0] = event.offsetX;
    this.cursorCoor[1] = event.offsetY;
  }
}