import { Component, AfterViewInit, OnChanges, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2 } from '@angular/core';
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
  @Input() processInfo: any[]; // Action, line index.

  @Output() roomImgScale = new EventEmitter<number[]>(); // Image natural width, image natural height.
  @Output() lineAddProcessControl = new EventEmitter<any[]>(); // Whether line extremities are complete, line to be added.
  @Output() lineEditProcessControl = new EventEmitter<number>(); // Line index.
  @Output() editResult = new EventEmitter<any[]>(); // Action, line index.

  initialized: boolean = false;

  imageScale: number; // Horizontal > 1
  imgNaturalWidth: number;
  imgNaturalHeight: number;
  canvasXMax: number;
  canvasYMax: number;

  lineSetCopy: number[][];
  lineSetToDisplayCopy: number[][];
  extremities: number[] = [];

  lineToBeAdded: number[] = [-1, -1, -1, -1];
  lineToBeAddedIsComplete: boolean;
  lineToBeAddedOutput: number[] = [-1, -1, -1, -1];
  lineAddProcessExtremities: number[][] = [[], []];

  lineToBeEdited: number[];
  lineAddInputIsFromLineEditProcess: boolean = false;

  firstExtremXInputControl: FormControl;
  firstExtremYInputControl: FormControl;
  secondExtremXInputControl: FormControl;
  secondExtremYInputControl: FormControl;

  showCursorCoor: boolean;
  cursorCoor: number[] = [-1, -1];

  @ViewChild('scaleContainerElement') scaleContainerElement: ElementRef;
  @ViewChild('roomTopViewImageElement') imgElement: ElementRef;
  @ViewChild('svgCanvasElement') svgCanvasElement: ElementRef;
  @ViewChild('cursorCoorContainerElement') cursorCoorContainerElement: ElementRef;
  @ViewChild('coorInputContainer') coorInputContainerElement: ElementRef;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {}

  ngOnChanges(): void {
    let action = this.processInfo[0];
    let lineIndex = this.processInfo[1];

    if (this.initialized) {
      this.lineSetCopy = JSON.parse(JSON.stringify(this.lineSet));
      this.lineSetToDisplayCopy = JSON.parse(JSON.stringify(this.lineSetToDisplay));

      this.setScaleContainerDimension();

      if (action === 'edit') {
        this.editLine(true, lineIndex);
      } else if (action !== 'add') {
        this.lineToBeAdded = [-1, -1, -1, -1];
        this.lineToBeAddedIsComplete = false;
        this.lineAddProcessExtremities = [[], []];
        this.lineAddInputIsFromLineEditProcess = false;
  
        this.firstExtremXInputControl = new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0), Validators.max(this.canvasXMax)]);
        this.firstExtremYInputControl = new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0), Validators.max(this.canvasYMax)]);
        this.secondExtremXInputControl = new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0), Validators.max(this.canvasXMax)]);
        this.secondExtremYInputControl = new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(0), Validators.max(this.canvasYMax)]);
      }
    }
  }

  // Initialize elements.
  public roomTopViewImgOnLoad(): void {
    this.lineSetCopy = JSON.parse(JSON.stringify(this.lineSet));
    this.lineSetToDisplayCopy = JSON.parse(JSON.stringify(this.lineSetToDisplay));

    this.setScaleContainerDimension();

    this.firstExtremXInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
    this.firstExtremYInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
    this.secondExtremXInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
    this.secondExtremYInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
    
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
  private setCursorCoordinatesContainerPosition(): void {
    let top = String(this.canvasSideLength - 10) + 'px';
    let width = String(this.canvasSideLength) + 'px';

    this.renderer.setStyle(this.cursorCoorContainerElement.nativeElement, 'top', top);
    this.renderer.setStyle(this.cursorCoorContainerElement.nativeElement, 'width', width);
  }
  private setCoordinatesInputContainerPosition(): void {
    let top = String(this.canvasSideLength + 35) + 'px';
    let width = String(this.canvasSideLength) + 'px';

    this.renderer.setStyle(this.coorInputContainerElement.nativeElement, 'top', top);
    this.renderer.setStyle(this.coorInputContainerElement.nativeElement, 'width', width);
  }

  // Line related functions.
  public lineClickAction(lineIndex: number): void {
    switch (this.processInfo[0]) {
      case 'remove':
        this.removeLine(lineIndex);
        break;
      case 'edit':
        break;
      default:
        this.editLine(false, lineIndex);
        break;
    }
  }
  public lineAddProcessInputOnKey(placeHolder: string, value: any): void {
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

    this.lineToBeAddedIsComplete = false;
    this.lineAddProcessExtremities = [[], []];
    
    if (this.lineToBeAdded[0] >= 0 && this.lineToBeAdded[0] <= this.canvasXMax
      && this.lineToBeAdded[1] >= 0 && this.lineToBeAdded[1] <= this.canvasYMax
      && this.lineToBeAdded[2] >= 0 && this.lineToBeAdded[2] <= this.canvasXMax
      && this.lineToBeAdded[3] >= 0 && this.lineToBeAdded[3] <= this.canvasYMax) { // Line complete.
        this.lineToBeAddedIsComplete = true;
      this.adjustLinesetCoordinates(true);

      this.lineAddProcessExtremities[0].push(this.lineToBeAdded[0], this.lineToBeAdded[1]);
      this.lineAddProcessExtremities[1].push(this.lineToBeAdded[2], this.lineToBeAdded[3]);
    } else if (this.lineToBeAdded[0] >= 0 && this.lineToBeAdded[0] <= this.canvasXMax 
      && this.lineToBeAdded[1] >= 0 && this.lineToBeAdded[1] <= this.canvasYMax) { // First extremity complete.
      this.lineAddProcessExtremities[0].push(this.lineToBeAdded[0], this.lineToBeAdded[1]);
      this.lineToBeAddedOutput = [-1, -1, -1, -1];
    } else if (this.lineToBeAdded[2] >= 0 && this.lineToBeAdded[2] <= this.canvasXMax
      && this.lineToBeAdded[3] >= 0 && this.lineToBeAdded[3] <= this.canvasYMax) { // Second extermity complete.
      this.lineAddProcessExtremities[1].push(this.lineToBeAdded[2], this.lineToBeAdded[3]);
      this.lineToBeAddedOutput = [-1, -1, -1, -1];
    }

    this.lineAddProcessControl.emit([this.lineToBeAddedIsComplete, this.lineToBeAddedOutput, this.lineAddInputIsFromLineEditProcess]);
  }
  public getErrorMessage(placeHolder: string) { // For now only an integer coordinate value within the canvas range does not display any error.
    let placeHolderControl;

    switch (placeHolder) {
      case 'firstExtremX':
        placeHolderControl = this.firstExtremXInputControl;
        break;
      case 'firstExtremY':
        placeHolderControl = this.firstExtremYInputControl;
        break;
      case 'secondExtremX':
        placeHolderControl = this.secondExtremXInputControl;
        break;
      case 'secondExtremY':
        placeHolderControl = this.secondExtremYInputControl;
        break;
      default:
        placeHolderControl = this.firstExtremXInputControl;
        console.error('Form input error!');
        break;
    }

    if (placeHolderControl.hasError('required')) {
      return 'A coordinate value is required!';
    }

    return 'Use a valid integer value!';
  }
  public canvasClickAction(): void {
    if (this.processInfo[0] === 'add' && !this.lineToBeAddedIsComplete) {
      if (!(this.lineToBeAdded[0] >= 0 && this.lineToBeAdded[0] <= this.canvasXMax 
        && this.lineToBeAdded[1] >= 0 && this.lineToBeAdded[1] <= this.canvasYMax)) { // The first extremity coordinates are incomplete.
          this.firstExtremXInputControl.setValue(this.cursorCoor[0]);
          this.firstExtremYInputControl.setValue(this.cursorCoor[1]);

          this.lineAddProcessInputOnKey('firstExtremX', this.cursorCoor[0]);
          this.lineAddProcessInputOnKey('firstExtremY', this.cursorCoor[1]);
      } else if (!(this.lineToBeAdded[2] >= 0 && this.lineToBeAdded[2] <= this.canvasXMax
        && this.lineToBeAdded[3] >= 0 && this.lineToBeAdded[3] <= this.canvasYMax)) { // The second extremity coordinates are incomplete.
          this.secondExtremXInputControl.setValue(this.cursorCoor[0]);
          this.secondExtremYInputControl.setValue(this.cursorCoor[1]);

          this.lineAddProcessInputOnKey('secondExtremX', this.cursorCoor[0]);
          this.lineAddProcessInputOnKey('secondExtremY', this.cursorCoor[1]);
      }
    }
  }
  public removeLine(lineIndex: number): void {
    this.extremities = [];
    this.editResult.emit(['remove', lineIndex]);
  }
  public editLine(startProcess: boolean, lineIndex: number): void {
    if (!startProcess) {
      this.lineToBeEdited = this.lineSetCopy[lineIndex];
      this.lineEditProcessControl.emit(lineIndex);
    } else {
      this.processInfo[0] = 'add';
      this.lineAddInputIsFromLineEditProcess = true;

      this.firstExtremXInputControl.setValue(this.lineToBeEdited[0].toFixed(0));
      this.firstExtremYInputControl.setValue(this.lineToBeEdited[1].toFixed(0));
      this.secondExtremXInputControl.setValue(this.lineToBeEdited[2].toFixed(0));
      this.secondExtremYInputControl.setValue(this.lineToBeEdited[3].toFixed(0));

      this.lineAddProcessInputOnKey('firstExtremX', this.lineToBeEdited[0]);
      this.lineAddProcessInputOnKey('firstExtremY', this.lineToBeEdited[1]);
      this.lineAddProcessInputOnKey('secondExtremX', this.lineToBeEdited[2]);
      this.lineAddProcessInputOnKey('secondExtremY', this.lineToBeEdited[3]);
    }
  }
  public showExtremities(lineIndex: number): void {
    if (lineIndex === -1) {
      this.extremities = [];
    } else {
      this.extremities = this.lineSetCopy[lineIndex];
    }
  }

  // Cursor coordinates related.
  public showCursorCoordinates(show: boolean): void {
    this.showCursorCoor = show;
  }
  public updateCursorCoordinates(event: any): void {
    this.cursorCoor[0] = event.offsetX;
    this.cursorCoor[1] = event.offsetY;
  }
}