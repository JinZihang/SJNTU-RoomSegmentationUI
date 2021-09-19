import { Component, AfterViewInit, ViewChild, ElementRef, Renderer2, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import linesetData from '../../assets/mock-lineset.json';
import { RoomSegDialog } from './room-seg-dialog/room-seg-dialog.component'

const CanvasSideLength = 600;

/*
TO DOs:
- Change the way of limiting input to numeric.
- Change the way to disable buttons.
- Change the way to extend lines, the current way leads to wrong result sometimes.
*/
@Component({
  selector: 'room-segmentation-ui',
  templateUrl: 'room-seg-ui.component.html',
  styleUrls: ['room-seg-ui.component.css']
})
export class RoomSegUIComponent implements AfterViewInit {
  // @Input: imageSrc & linesets.
  // @Output: linesets
  // Output at this.openDialog(): {switch(action): {case 'Proceed'}}.

  imageSrc: string = '/assets/mock-image.png';
  imageDim: number; // imageDim > 1 if the image is vertical.
  canvasXMax:number;
  canvasYMax: number;

  linesets: number[][] = linesetData.Linesets;
  linesetsBeforeEdit: number[][];
  linesetsBeforeLineEdit: number[][];

  extendedLinesets: number[][] = [];
  extendedLinesetsBeforeEdit: number[][];
  extendedLinesetsBeforeLineEdit: number[][];
  
  lineSegment: boolean = true;
  extremities: number[] = [];
  tempExtremEdit: boolean = false;

  showCursor: boolean = false;
  cursorPosition: number[] = [-1, -1];

  processStart: boolean = false;
  editSegStart: boolean = false;
  addProcessStart: boolean = false;
  removalProcessStart: boolean = false;
  
  firstExtremXCoorCheck: FormControl;
  firstExtremYCoorCheck: FormControl;
  secondExtremXCoorCheck: FormControl;
  secondExtremYCoorCheck: FormControl;

  addLineElementIndex: number;
  addLineProcessShowTempExtremity: boolean = false;
  addLineTempExtremity: number[];
  addLineValueComplete: boolean = false;

  addFirstExtremX: any;
  addFirstExtremY: any;
  addSecondExtremX: any;
  addSecondExtremY: any;

  actionButtonDisable: boolean = false;
  processConfirmButtonDisable: boolean = false;

  @ViewChild('dimContainer') dimContainerElement: ElementRef;
  @ViewChild('roomTopViewImage') imageElement: ElementRef;
  @ViewChild('line') lineElement: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  ngAfterViewInit() {}

  // Initialization
  public roomImgOnLoad(): void {
    this.resizeDimContainer()
    this.extendLineSegments();

    this.linesetsBeforeEdit = JSON.parse(JSON.stringify(this.linesets));
    this.extendedLinesetsBeforeEdit = JSON.parse(JSON.stringify(this.extendedLinesets));

    this.firstExtremXCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
    this.firstExtremYCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
    this.secondExtremXCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
    this.secondExtremYCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
  }

  // Resize the dimContainerElement according to the original image dimension.
  private resizeDimContainer(): void {
    let imgNaturalHeight = (this.imageElement.nativeElement as HTMLImageElement).naturalHeight;
    let imgNaturalWidth = (this.imageElement.nativeElement as HTMLImageElement).naturalWidth;
    this.imageDim = imgNaturalHeight / imgNaturalWidth;

    if (this.imageDim > 1) {
      this.canvasXMax = CanvasSideLength/this.imageDim;
      this.canvasYMax = CanvasSideLength;

      let width = String(100/this.imageDim) + '%';
      let leftMargin = String(0.5*(100 - 100/this.imageDim)) + '%';

      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'height', '100%');
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'width', width);
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'margin-left', leftMargin);
    } else {
      this.canvasXMax = CanvasSideLength;
      this.canvasYMax = CanvasSideLength*this.imageDim;

      let height = String(100*this.imageDim) + '%';
      let topMargin = String(0.5*(100 - 100*this.imageDim)) + '%';

      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'height', height);
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'margin-top', topMargin);
    }

    this.adjustLinesetCoordinates(imgNaturalHeight, imgNaturalWidth);
  }

  // Adjust linesets' coordinates according to the canvas dimension.
  private adjustLinesetCoordinates(imgNaturalHeight: number, imgNaturalWidth: number): void {
    for (let i=0; i<this.linesets.length; i++) {
      this.linesets[i][0] = (this.linesets[i][0] / imgNaturalWidth) * this.canvasXMax;
      this.linesets[i][1] = (this.linesets[i][1] / imgNaturalHeight) * this.canvasYMax;
      this.linesets[i][2] = (this.linesets[i][2] / imgNaturalWidth) * this.canvasXMax;
      this.linesets[i][3] = (this.linesets[i][3] / imgNaturalHeight) * this.canvasYMax;
    }
  }

  private extendLineSegments(): void {
    this.extendedLinesets = [];

    for (let i=0; i<this.linesets.length; i++) {
      let x1 = this.linesets[i][0];
      let y1 = this.linesets[i][1];
      let x2 = this.linesets[i][2];
      let y2 = this.linesets[i][3];

      let extendedLine: any = [];  // Equation of the line is 'y = (x-x1) * (y1-y2)/(x1-x2) + y1'.

      // Find the 1st point.
      let val1 = x1 * (y2-y1)/(x1-x2) + y1;
      val1 > 0 ? extendedLine.push(0, val1) : extendedLine.push((x2*y1-x1*y2) / (y1-y2), 0);
      
      // Find the 2nd point.
      if (this.imageDim > 1) {
        let val2 = (this.canvasXMax-x1) * (y1-y2)/(x1-x2) + y1;
        val2 < this.canvasYMax ? extendedLine.push(this.canvasXMax, val2) 
                                : extendedLine.push((this.canvasYMax*(x1-x2)-x1*y2+x2*y1) / (y1-y2), this.canvasYMax);
      } else {
        let val2 = (this.canvasXMax-x1)*(y1-y2) / (x1-x2) + y1;
        val2 < this.canvasYMax ? extendedLine.push(this.canvasXMax, val2) 
                                              : extendedLine.push((this.canvasYMax*(x1- 2)-x1*y2+x2*y1) / (y1-y2), this.canvasYMax);
      }
      
      this.extendedLinesets.push(extendedLine);
    }
  }

  public showExtremities(elementIndex: number, lineSegment: boolean): void {
    let lineShrink = this.removalProcessStart ? 0 : 3;

    if (lineSegment) {
      this.extremities = elementIndex !== -1 ? this.linesets[elementIndex] : [];
    } else if (this.removalProcessStart || this.editSegStart) {
      this.extremities = elementIndex !== -1 ? this.linesets[elementIndex] : [];
    } else if (this.addProcessStart && elementIndex === this.addLineElementIndex && this.addLineValueComplete) {
      this.extremities = elementIndex !== -1 ? this.linesets[elementIndex] : [];
    } else if (elementIndex !== -1) {
      this.tempExtremEdit = true;

      this.extremities = this.extendedLinesets[elementIndex];
      this.extremities[0] = this.extremities[0] === 0 ? lineShrink : this.extremities[0];
      this.extremities[1] = this.extremities[1] === 0 ? lineShrink : this.extremities[1];

      this.extremities[2] = this.extremities[2] === this.canvasXMax ? this.canvasXMax-lineShrink : this.extremities[2];
      this.extremities[3] = this.extremities[3] === this.canvasYMax ? this.canvasYMax-lineShrink : this.extremities[3];
    }

    if (elementIndex === -1) {
      this.extremities = [];
      if (this.tempExtremEdit) {
        if (!this.addProcessStart) {
          this.extendedLinesets = JSON.parse(JSON.stringify(this.extendedLinesetsBeforeEdit));
          this.tempExtremEdit = false;
        } else if (this.addLineValueComplete) {
          this.extendedLinesets = JSON.parse(JSON.stringify(this.extendedLinesetsBeforeEdit));
          this.tempExtremEdit = false;

          this.extendLineSegments();
        }
      }
    }
  }

  public showCursorPosition(show: boolean): void {
    this.showCursor = show;
  }

  public updateCursorPosition(event: any): void {
    this.cursorPosition[0] = event.clientX - 46;
    this.cursorPosition[1] = event.clientY - 28;
  }

  public editSegLine(elementIndex: number, confirmed: boolean): void {
    console.log('elementIndex');
    console.log(elementIndex);
    if (confirmed) {
      this.editSegStart = true;

      this.linesetsBeforeLineEdit = JSON.parse(JSON.stringify(this.linesets));
      this.extendedLinesetsBeforeLineEdit = JSON.parse(JSON.stringify(this.extendedLinesets));
      
      this.lineAdd(true, elementIndex, this.linesetsBeforeLineEdit[elementIndex]);
    } else {
      this.openDialog('Edit this segmentation line?', 'Use cursor to move the line or key in its new extremities\' coordinates.', elementIndex, 'Edit');
    }
  }

  public lineSwitch(): void {
    this.lineSegment = !this.lineSegment;
  }

  public lineAdd(startProcess: boolean, elementIndex: number, initialCoor: number[]): void {
    if (!startProcess) {
      this.openDialog('Add a segmentation line?', 'Use cursor to place extremities or key in their coordinates.', this.linesets.length + 1, 'Add');
    } else {
      this.processStart = true;
      this.addProcessStart = true;

      this.actionButtonDisable = true;
      this.processConfirmButtonDisable = true;

      this.linesetsBeforeEdit = JSON.parse(JSON.stringify(this.linesets));
      this.extendedLinesetsBeforeEdit = JSON.parse(JSON.stringify(this.extendedLinesets));

      if (elementIndex === -1) {
        this.addLineElementIndex = this.linesets.length;
      } else {
        this.addLineElementIndex = elementIndex;

        let initialFirstExtremX: FormControl = this.firstExtremXCoorCheck;
        let initialFirstExtremY: FormControl = this.firstExtremYCoorCheck;
        let initialSecondExtremX: FormControl = this.secondExtremXCoorCheck;
        let initialSecondExtremY: FormControl = this.secondExtremYCoorCheck;

        initialFirstExtremX.setValue(initialCoor[0].toFixed(0));
        initialFirstExtremY.setValue(initialCoor[1].toFixed(0));
        initialSecondExtremX.setValue(initialCoor[2].toFixed(0));
        initialSecondExtremY.setValue(initialCoor[3].toFixed(0));

        this.addLineInputOnKey('firstExtremX', initialCoor[0].toFixed(0), true);
        this.addLineInputOnKey('firstExtremY', initialCoor[1].toFixed(0), true);
        this.addLineInputOnKey('secondExtremX', initialCoor[2].toFixed(0), true);
        this.addLineInputOnKey('secondExtremY', initialCoor[3].toFixed(0), true);
      }
    }
  }

  public addLineInputOnKey(placeHolder: string, value: any, isFromMoveLineProcess: boolean) {
    let canAddLine = false;

    if (!isNaN(Number(value)) && Number(value) >= 0) {
      value = Number(value);

      switch (placeHolder) {
        case 'firstExtremX':
          if (value < this.canvasXMax) {
            canAddLine = true;
            this.addFirstExtremX = value;
          } 
          break;
        case 'firstExtremY':
          if (value < this.canvasYMax) {
            canAddLine = true;
            this.addFirstExtremY = value;
          } 
          break;
        case 'secondExtremX':
          if (value < this.canvasXMax) {
            canAddLine = true;
            this.addSecondExtremX = value;
          } 
          break;
        case 'secondExtremY':
          if (value < this.canvasYMax) {
            canAddLine = true;
            this.addSecondExtremY = value;
          } 
          break;
      }
  
      if (canAddLine) {
        if (this.addFirstExtremX && this.addFirstExtremY && this.addSecondExtremX && this.addSecondExtremY) {
          this.addLineValueComplete = true;
          this.processConfirmButtonDisable = false;
    
          this.addLineProcessShowTempExtremity = false;
          this.addLineTempExtremity = [];
    
          this.linesets[this.addLineElementIndex] = [this.addFirstExtremX, this.addFirstExtremY, this.addSecondExtremX, this.addSecondExtremY];
          this.extendLineSegments();
        } else {
          this.addLineValueComplete = false;
          this.processConfirmButtonDisable = true;

          if (!isFromMoveLineProcess && !this.editSegStart){
            delete this.linesets[this.addLineElementIndex];
            delete this.extendedLinesets[this.addLineElementIndex];
            this.linesets.length = this.addLineElementIndex;
            this.extendedLinesets.length = this.addLineElementIndex;
          }
          
          this.addLineProcessShowTempExtremity = false;
          this.addLineTempExtremity = [];
    
          if (this.addFirstExtremX && this.addFirstExtremY) {
            this.addLineProcessShowTempExtremity = true;
            this.addLineTempExtremity = [this.addFirstExtremX, this.addFirstExtremY]
          } else if (this.addSecondExtremX && this.addSecondExtremY) {
            this.addLineProcessShowTempExtremity = true;
            this.addLineTempExtremity = [this.addSecondExtremX, this.addSecondExtremY]
          }
        }
      } else {
        console.warn('Use a valid coordinate value!')
        this.processConfirmButtonDisable = true;
      }
    } else {
      console.warn('Use a valid coordinate value!')
      this.processConfirmButtonDisable = true;
    }
  }
  
  public getErrorMessage(placeHolder: string) {
    let placeHolderInput: FormControl = this.firstExtremXCoorCheck;
    switch (placeHolder) {
      case 'firstExtremXCoor':
        placeHolderInput = this.firstExtremXCoorCheck;
        break;
      case 'firstExtremYCoor':
        placeHolderInput = this.firstExtremYCoorCheck;
        break;
      case 'secondExtremXCoor':
        placeHolderInput = this.secondExtremXCoorCheck;
        break;
      case 'secondExtremYCoor':
        placeHolderInput = this.secondExtremYCoorCheck;
        break;
    }

    if (placeHolderInput.hasError('min') || placeHolderInput.hasError('max')) {
      return 'Use a valid coordinate value!'
    }

    return placeHolderInput.hasError('required') ? 'A coordinate value is required!' : '';
  }

  public lineRemove(startProcess: boolean): void {
    if (!startProcess) {
      this.openDialog('Start removing segmentation lines?', 'Use cursor to click on the lines you want to remove.', -1, 'Remove');
    } else {
      this.processStart = true;
      this.removalProcessStart = true;

      this.actionButtonDisable = true;

      this.linesetsBeforeEdit = JSON.parse(JSON.stringify(this.linesets));
      this.extendedLinesetsBeforeEdit = JSON.parse(JSON.stringify(this.extendedLinesets));
    }
  }

  public removeLine(elementIndex: number): void {
    this.linesets = this.linesets.filter(e => e !== this.linesets[elementIndex]);
    this.extendedLinesets = this.extendedLinesets.filter(e => e !== this.extendedLinesets[elementIndex]);

    this.extremities = [];
  }
  
  public segConfirm(): void {
    this.openDialog('Proceed with this room segmentaion result?', 'Press cancel if you want to make further changes.', -1, 'Proceed');
  }

  private openDialog(title: string, content: string, elementIndex: number, action: string): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.data = {
      title: title,
      content: content,
      elementIndex: elementIndex,
      action: action
    };

    let dialogRef = this.dialog.open(RoomSegDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      let confirm = result[0];
      let elementIndex = result[1];
      let action = result[2];

      if (confirm) {
        switch (action) {
          case 'Edit':
            this.editSegLine(elementIndex, true)
            break;
          case 'Add':
            this.lineAdd(true, -1, []);
            break;
          case 'Remove':
            this.lineRemove(true);
            break;
          case 'Proceed':
            // Output this.linesets and jump to the next step's page.
            break;
        }
      }
    });
  }

  public processControl(processConfirm: boolean): void {
    if (!processConfirm) {
      this.linesets = JSON.parse(JSON.stringify(this.linesetsBeforeEdit));
      this.extendedLinesets = JSON.parse(JSON.stringify(this.extendedLinesetsBeforeEdit));
    } else {
      this.linesetsBeforeEdit = JSON.parse(JSON.stringify(this.linesets));
      this.extendedLinesetsBeforeEdit = JSON.parse(JSON.stringify(this.extendedLinesets));
    }

    this.processStart = false;
    this.actionButtonDisable = false;

    if (this.editSegStart) {
      this.editSegStart = false;
      this.addProcessStart = false;

      this.addLineProcessShowTempExtremity = false;

      this.firstExtremXCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
      this.firstExtremYCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
      this.secondExtremXCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
      this.secondExtremYCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);

      this.linesetsBeforeLineEdit = [];
      this.extendedLinesetsBeforeLineEdit = [];
    } 
    if (this.addProcessStart) {
      this.addProcessStart = false;

      this.firstExtremXCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
      this.firstExtremYCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);
      this.secondExtremXCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasXMax)]);
      this.secondExtremYCoorCheck = new FormControl('', [Validators.required, Validators.min(0), Validators.max(this.canvasYMax)]);

      this.addFirstExtremX = undefined;
      this.addFirstExtremY = undefined;
      this.addSecondExtremX = undefined;
      this.addSecondExtremY = undefined;

      this.addLineTempExtremity = [];
      this.addLineValueComplete = false;
      this.processConfirmButtonDisable = false;
    } else if (this.removalProcessStart) {
      this.removalProcessStart = false;
    }
  }
}