import { Component, OnChanges, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ProcessInfo, LineAddProcessInfo } from '../room-segmentation';

@Component({
  selector: 'room-seg-display',
  templateUrl: 'room-seg-display.component.html',
  styleUrls: ['room-seg-display.component.css']
})
export class RoomSegDisplayComponent implements OnChanges {
  @Input() canvasSideLength: number;
  @Input() imgSrc: string;
  @Input() lineSet: number[][];
  @Input() lineSetToDisplay: number[][];
  @Input() processInfo: ProcessInfo;
  @Input() updateTriggerer: string;

  @Output() roomImgScale = new EventEmitter<number[]>();
  @Output() lineAddProcessControl = new EventEmitter<LineAddProcessInfo>();
  @Output() lineEditProcessControl = new EventEmitter<number>();
  @Output() editResult = new EventEmitter<ProcessInfo>();
  @Output() forceUpdate = new EventEmitter<null>();

  initialized: boolean = false;

  imgScale: number; // Horizontal > 1
  imgNaturalWidth: number;
  imgNaturalHeight: number;
  canvasXMax: number;
  canvasYMax: number;
  canvasPointer: boolean = false;

  lineSetCopy: number[][];
  lineSetToDisplayCopy: number[][];
  extremities: number[] = [];

  // Line-add process variables.
  lineToBeAdded: number[] = [-1, -1, -1, -1];
  isLineToBeAddedComplete: boolean;
  lineToBeAddedOutput: number[] = [-1, -1, -1, -1];
  lineAddProcessExtremities: number[][] = [[], []];

  firstExtremXInputControl: FormControl;
  firstExtremYInputControl: FormControl;
  secondExtremXInputControl: FormControl;
  secondExtremYInputControl: FormControl;

  // Line-edit process variables.
  lineToBeEdited: number[];
  lineAddInputIsFromLineEditProcess: boolean = false;

  // Line-move process variables.
  moveLineProcessStart: boolean;
  elementToBeMoved: string = '';
  lineMoveProcessMouseDownCoor: number[];
  lineMoveProcessInitialLinePosition: number[];

  showCursorCoor: boolean;
  cursorCoor: number[] = [-1, -1];

  @ViewChild('scaleContainerElement') scaleContainerElement: ElementRef;
  @ViewChild('roomTopViewImageElement') imgElement: ElementRef;
  @ViewChild('svgCanvasElement') svgCanvasElement: ElementRef;
  @ViewChild('cursorCoorContainerElement') cursorCoorContainerElement: ElementRef;
  @ViewChild('coorInputContainer') coorInputContainerElement: ElementRef;

  constructor(private renderer: Renderer2) {}

  ngOnChanges(): void {
    if (this.initialized) {
      this.lineSetCopy = JSON.parse(JSON.stringify(this.lineSet));
      this.lineSetToDisplayCopy = JSON.parse(JSON.stringify(this.lineSetToDisplay));

      this.setScaleContainerDimension();

      if (this.processInfo.action === 'add' && !this.isLineToBeAddedComplete) {
        this.canvasPointer = true;
      } else if (this.processInfo.action !== 'add') {
        this.canvasPointer = false;
        this.lineToBeAdded = [-1, -1, -1, -1];
        this.isLineToBeAddedComplete = false;
        this.lineAddProcessExtremities = [[], []];
        this.lineAddInputIsFromLineEditProcess = false;
  
        this.firstExtremXInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
        this.firstExtremYInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
        this.secondExtremXInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
        this.secondExtremYInputControl = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
      }

      if (this.processInfo.action === 'edit') {
        this.editLine(true, this.processInfo.lineIndex);
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
    this.imgScale = this.imgNaturalWidth/this.imgNaturalHeight;

    if (this.imgScale > 1) {
      this.canvasXMax = this.canvasSideLength;
      this.canvasYMax = this.canvasSideLength/this.imgScale;

      const height = String(100/this.imgScale) + '%';
      const topMargin = String(0.5*(100 - 100/this.imgScale)) + '%';

      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'height', height);
      this.renderer.setStyle(this.scaleContainerElement.nativeElement, 'margin-top', topMargin);
    } else {
      this.canvasXMax = this.canvasSideLength*this.imgScale;
      this.canvasYMax = this.canvasSideLength;

      const width = String(100*this.imgScale) + '%';
      const topMargin = String(0.5*(100 - 100*this.imgScale)) + '%';

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
    const top = String(this.canvasSideLength - 10) + 'px';
    const width = String(this.canvasSideLength) + 'px';

    this.renderer.setStyle(this.cursorCoorContainerElement.nativeElement, 'top', top);
    this.renderer.setStyle(this.cursorCoorContainerElement.nativeElement, 'width', width);
  }
  private setCoordinatesInputContainerPosition(): void {
    const top = String(this.canvasSideLength + 35) + 'px';
    const width = String(this.canvasSideLength) + 'px';

    this.renderer.setStyle(this.coorInputContainerElement.nativeElement, 'top', top);
    this.renderer.setStyle(this.coorInputContainerElement.nativeElement, 'width', width);
  }

  // Line related functions.
  public lineClickAction(lineIndex: number): void {
    switch (this.processInfo.action) {
      case 'remove':
        this.removeLine(lineIndex);
        break;
      case 'add':
        break;
      case 'edit':
        break;
      default:
        this.editLine(false, lineIndex);
        break;
    }
  }
  public lineAddProcessInputOnKey(placeHolder: string, value: string): void {
    switch (placeHolder) {
      case 'firstExtremX':
        if(value === '' || Number(value) < 0 || Number(value) > this.canvasXMax) {
          this.lineToBeAdded[0] = -1;
        } else {
          this.lineToBeAdded[0] = Number(value);
        }
        break;
      case 'firstExtremY':
        if(value === '' || Number(value) < 0 || Number(value) > this.canvasYMax) {
          this.lineToBeAdded[1] = -1;
        } else {
          this.lineToBeAdded[1] = Number(value);
        }
        break;
      case 'secondExtremX':
        if(value === '' || Number(value) < 0 || Number(value) > this.canvasXMax) {
          this.lineToBeAdded[2] = -1;
        } else {
          this.lineToBeAdded[2] = Number(value);
        }
        break;
      case 'secondExtremY':
        if(value === '' || Number(value) < 0 || Number(value) > this.canvasYMax) {
          this.lineToBeAdded[3] = -1;
        } else {
          this.lineToBeAdded[3] = Number(value);
        }
        break;
    }

    this.canvasPointer = true;
    this.isLineToBeAddedComplete = false;
    this.lineAddProcessExtremities = [[], []];
    
    if (this.lineToBeAdded[0] >= 0 && this.lineToBeAdded[0] <= this.canvasXMax
      && this.lineToBeAdded[1] >= 0 && this.lineToBeAdded[1] <= this.canvasYMax
      && this.lineToBeAdded[2] >= 0 && this.lineToBeAdded[2] <= this.canvasXMax
      && this.lineToBeAdded[3] >= 0 && this.lineToBeAdded[3] <= this.canvasYMax) { // Line complete.
        this.canvasPointer = false;

        this.isLineToBeAddedComplete = true;
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

    this.lineAddProcessControl.emit({
      isLineToBeAddedComplete: this.isLineToBeAddedComplete,
      isTriggeredByLineEditProcess: this.lineAddInputIsFromLineEditProcess,
      lineToBeAdded: this.lineToBeAddedOutput
    });
  }
  public moveLineProcessControl(event: any, startProcess: boolean): void {
    this.moveLineProcessStart = startProcess;

    if (this.processInfo.action === 'add') {
      const selectX = event.offsetX;
      const selectY = event.offsetY

      const firstExtremX = this.lineToBeAdded[0];
      const firstExtremY = this.lineToBeAdded[1];
      const secondExtremX = this.lineToBeAdded[2];
      const secondExtremY = this.lineToBeAdded[3];

      // The equation of line is 'y = (x-x1) * (y1-y2)/(x1-x2) + y1' ('x = (y-y1) * (x1-x2)/(y1-y2) + x1').
      const valueDifference = Math.abs(firstExtremX - secondExtremX) > Math.abs(firstExtremY - secondExtremY)
      // Assume the mouse down point to be on the line, use one of its coordinate value to calculate the other one.
      // Then compare it with the real value to see if the click point is approximately on the line. 
        ? Math.abs(Math.abs(selectY) - Math.abs((selectX-firstExtremX) * (firstExtremY-secondExtremY)/(firstExtremX-secondExtremX) + firstExtremY)) // If the line is approximately horizontal.
        : Math.abs(Math.abs(selectX) - Math.abs((selectY-firstExtremY) * (firstExtremX-secondExtremX)/(firstExtremY-secondExtremY) + firstExtremX)); // If the line is approximately vertical.

      if (Math.abs(firstExtremX-selectX) <= 3 && Math.abs(firstExtremY-selectY) <= 3) { // The mouse down point is around the first line extremity.
          this.elementToBeMoved = 'firstExtremity';
      } else if (Math.abs(secondExtremX-selectX) <= 3 && Math.abs(secondExtremY-selectY) <= 3) { // The mouse down point is around the second line extremity.
          this.elementToBeMoved = 'secondExtremity';
      } else if (valueDifference <= 3) { // The mouse down point is approximately on the line.
        this.elementToBeMoved = 'lineToBeAdded';

        this.lineMoveProcessMouseDownCoor = [selectX, selectY];
        this.lineMoveProcessInitialLinePosition = JSON.parse(JSON.stringify(this.lineToBeAdded));
      } else {
        this.elementToBeMoved = '';
      }
    }
  }
  public removeLine(lineIndex: number): void {
    this.extremities = [];
    this.editResult.emit({
      action: 'remove',
      lineIndex: lineIndex
    });
  }
  public editLine(startProcess: boolean, lineIndex?: number): void {
    if (lineIndex) {
      if (!startProcess) {
        this.lineToBeEdited = this.lineSetCopy[lineIndex];
        this.lineEditProcessControl.emit(lineIndex);
      } else {
        this.processInfo.action = 'add';
        this.lineAddInputIsFromLineEditProcess = true;
  
        this.firstExtremXInputControl.setValue(this.lineToBeEdited[0].toFixed(0));
        this.firstExtremYInputControl.setValue(this.lineToBeEdited[1].toFixed(0));
        this.secondExtremXInputControl.setValue(this.lineToBeEdited[2].toFixed(0));
        this.secondExtremYInputControl.setValue(this.lineToBeEdited[3].toFixed(0));
  
        this.lineAddProcessInputOnKey('firstExtremX', String(this.lineToBeEdited[0]));
        this.lineAddProcessInputOnKey('firstExtremY', String(this.lineToBeEdited[1]));
        this.lineAddProcessInputOnKey('secondExtremX', String(this.lineToBeEdited[2]));
        this.lineAddProcessInputOnKey('secondExtremY', String(this.lineToBeEdited[3]));
      }
    } else {
      console.error('editLine(): line index missing!')
    }
  }
  public showExtremities(lineIndex: number): void {
    if (lineIndex === -1) {
      this.extremities = [];
    } else if (this.processInfo.action !== 'add') {
      this.extremities = this.lineSetCopy[lineIndex];
    }
  }

  // Cursor coordinates related.
  public showCursorCoordinates(show: boolean): void {
    this.showCursorCoor = show;
    if (!show) {
      this.moveLineProcessStart = false;
    }
  }
  public canvasCursorMoveAction(event: any): void {
    // For displaying cursor position.
    this.cursorCoor[0] = event.offsetX;
    this.cursorCoor[1] = event.offsetY;

    // For the line-move process.
    if (this.processInfo.action === 'add' && this.moveLineProcessStart) {
      const cursorX = event.offsetX;
      const cursorY = event.offsetY;

      switch (this.elementToBeMoved) {
        case 'firstExtremity':
          this.firstExtremXInputControl.setValue(cursorX);
          this.firstExtremYInputControl.setValue(cursorY);
          this.lineAddProcessInputOnKey('firstExtremX', String(cursorX));
          this.lineAddProcessInputOnKey('firstExtremY', String(cursorY));
          break;

        case 'secondExtremity':
          this.secondExtremXInputControl.setValue(cursorX);
          this.secondExtremYInputControl.setValue(cursorY);
          this.lineAddProcessInputOnKey('secondExtremX', String(cursorX));
          this.lineAddProcessInputOnKey('secondExtremY', String(cursorY));
          break;

        case 'lineToBeAdded':
          const xDisplacement = cursorX - this.lineMoveProcessMouseDownCoor[0];
          const yDisplacement = cursorY - this.lineMoveProcessMouseDownCoor[1];

          const afterMoveFirstExtremX = this.lineMoveProcessInitialLinePosition[0] + xDisplacement;
          const afterMoveFirstExtremY = this.lineMoveProcessInitialLinePosition[1] + yDisplacement;
          const afterMoveSecondExtremX = this.lineMoveProcessInitialLinePosition[2] + xDisplacement;
          const afterMoveSecondExtremY = this.lineMoveProcessInitialLinePosition[3] + yDisplacement;

          if (afterMoveFirstExtremX >= 0 && afterMoveFirstExtremX <= this.canvasXMax
            && afterMoveFirstExtremY >= 0 && afterMoveFirstExtremY <= this.canvasYMax
            && afterMoveSecondExtremX >= 0 && afterMoveSecondExtremX <= this.canvasXMax
            && afterMoveSecondExtremY >= 0 && afterMoveSecondExtremY <= this.canvasYMax) {
              this.firstExtremXInputControl.setValue((afterMoveFirstExtremX).toFixed(0));
              this.firstExtremYInputControl.setValue((afterMoveFirstExtremY).toFixed(0));
              this.secondExtremXInputControl.setValue((afterMoveSecondExtremX).toFixed(0));
              this.secondExtremYInputControl.setValue((afterMoveSecondExtremY).toFixed(0));

              this.lineAddProcessInputOnKey('firstExtremX', String(afterMoveFirstExtremX));
              this.lineAddProcessInputOnKey('firstExtremY', String(afterMoveFirstExtremY));
              this.lineAddProcessInputOnKey('secondExtremX', String(afterMoveSecondExtremX));
              this.lineAddProcessInputOnKey('secondExtremY', String(afterMoveSecondExtremY));
          }

          break;
      }

      this.forceUpdate.emit();
    }
  }
  public canvasCursorClickAction(): void {
    if (this.processInfo.action === 'add' && !this.isLineToBeAddedComplete) {
      if (!(this.lineToBeAdded[0] >= 0 && this.lineToBeAdded[0] <= this.canvasXMax 
        && this.lineToBeAdded[1] >= 0 && this.lineToBeAdded[1] <= this.canvasYMax)) { // The first extremity coordinates are incomplete.
          this.firstExtremXInputControl.setValue(this.cursorCoor[0]);
          this.firstExtremYInputControl.setValue(this.cursorCoor[1]);

          this.lineAddProcessInputOnKey('firstExtremX', String(this.cursorCoor[0]));
          this.lineAddProcessInputOnKey('firstExtremY', String(this.cursorCoor[1]));
      } else if (!(this.lineToBeAdded[2] >= 0 && this.lineToBeAdded[2] <= this.canvasXMax
        && this.lineToBeAdded[3] >= 0 && this.lineToBeAdded[3] <= this.canvasYMax)) { // The second extremity coordinates are incomplete.
          this.secondExtremXInputControl.setValue(this.cursorCoor[0]);
          this.secondExtremYInputControl.setValue(this.cursorCoor[1]);

          this.lineAddProcessInputOnKey('secondExtremX', String(this.cursorCoor[0]));
          this.lineAddProcessInputOnKey('secondExtremY', String(this.cursorCoor[1]));
      }
    }
  }
}