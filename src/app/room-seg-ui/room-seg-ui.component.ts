import { Component, AfterViewInit, ViewChild, ElementRef, Renderer2, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import linesetData from '../../assets/mock-lineset.json';
import { RoomSegDialog } from './room-seg-dialog/room-seg-dialog.component'

const CanvasSideLength = 600;

@Component({
  selector: 'room-segmentation-ui',
  templateUrl: 'room-seg-ui.component.html',
  styleUrls: ['room-seg-ui.component.css']
})
export class RoomSegUIComponent implements AfterViewInit {
  // Change imageSrc and linsets to @Input after completing the UI
  // Add a @Output linesets variable after completing the UI

  imageSrc: string = '/assets/mock-image.png';
  imageDim: number; // imageDim > 1 if the image is vertical.

  linesets: number[][] = linesetData.Linesets;
  extendedLinesets: number[][] = [];
  linesetsBeforeEdit: number[][];
  extendedLinesetsBeforeEdit: number[][];

  lineSegment: boolean = true;
  extremities: number[] = [];
  tempExtremEdit: boolean = false;

  showCursor: boolean = false;
  cursorPosition: number[] = [-1, -1];

  processStart: boolean = false;
  removalProcessStart: boolean = false;
  addProcessStart: boolean = false;
  addLineElementIndex: number;
  addLineProcessShowTempExtremity: boolean = false;
  addLineTempExtremity: number[];
  addLineValueComplete: boolean = false;

  addFirstExtremX: any;
  addFirstExtremY: any;
  addSecondExtremX: any;
  addSecondExtremY: any;

  @ViewChild('dimContainer') dimContainerElement: ElementRef;
  @ViewChild('roomTopViewImage') imageElement: ElementRef;
  @ViewChild('svg') svgElement: ElementRef;
  @ViewChild('line') lineElement: ElementRef;
  @ViewChild('removeLineButton') removeLineButtonElement: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  ngAfterViewInit() {}

  public roomImgOnLoad(): void {
    this.resizeDimContainer()
    this.extendLineSegments();

    this.linesetsBeforeEdit = JSON.parse(JSON.stringify(this.linesets));
    this.extendedLinesetsBeforeEdit = JSON.parse(JSON.stringify(this.extendedLinesets));
  }

  // Resize the dimContainerElement according to the original image dimension.
  private resizeDimContainer(): void {
    let imgNaturalHeight = (this.imageElement.nativeElement as HTMLImageElement).naturalHeight;
    let imgNaturalWidth = (this.imageElement.nativeElement as HTMLImageElement).naturalWidth;
    this.imageDim = imgNaturalHeight / imgNaturalWidth;

    if (this.imageDim > 1) {
      let width = String(100/this.imageDim) + '%';
      let leftMargin = String(0.5*(100 - 100/this.imageDim)) + '%';

      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'height', '100%');
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'width', width);
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'margin-left', leftMargin);
    } else {
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
    if (this.imageDim > 1) {
      for (let i=0; i<this.linesets.length; i++) {
        this.linesets[i][0] = (this.linesets[i][0] / imgNaturalWidth) * CanvasSideLength/this.imageDim;
        this.linesets[i][1] = (this.linesets[i][1] / imgNaturalHeight) * CanvasSideLength;
        this.linesets[i][2] = (this.linesets[i][2] / imgNaturalWidth) * CanvasSideLength/this.imageDim;
        this.linesets[i][3] = (this.linesets[i][3] / imgNaturalHeight) * CanvasSideLength;
      }
    } else {
      for (let i=0; i<this.linesets.length; i++) {
        this.linesets[i][0] = (this.linesets[i][0] / imgNaturalWidth) * CanvasSideLength;
        this.linesets[i][1] = (this.linesets[i][1] / imgNaturalHeight) * CanvasSideLength*this.imageDim;
        this.linesets[i][2] = (this.linesets[i][2] / imgNaturalWidth) * CanvasSideLength;
        this.linesets[i][3] = (this.linesets[i][3] / imgNaturalHeight) * CanvasSideLength*this.imageDim;
      }
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
        let val2 = (CanvasSideLength/this.imageDim-x1) * (y1-y2)/(x1-x2) + y1;
        val2 < CanvasSideLength ? extendedLine.push(CanvasSideLength/this.imageDim, val2) 
                                : extendedLine.push((CanvasSideLength*(x1-x2)-x1*y2+x2*y1) / (y1-y2), CanvasSideLength);
      } else {
        let val2 = (CanvasSideLength-x1)*(y1-y2) / (x1-x2) + y1;
        val2 < CanvasSideLength*this.imageDim ? extendedLine.push(CanvasSideLength, val2) 
                                              : extendedLine.push((CanvasSideLength*this.imageDim*(x1- 2)-x1*y2+x2*y1) / (y1-y2), CanvasSideLength*this.imageDim);
      }
      
      this.extendedLinesets.push(extendedLine);
    }
  }

  public showExtremities(elementIndex: number, lineSegment: boolean): void {
    let lineShrink = this.removalProcessStart ? 0 : 3;

    if (lineSegment) {
      this.extremities = elementIndex !== -1 ? this.linesets[elementIndex] : [];
    } else if (this.removalProcessStart) {
      this.extremities = elementIndex !== -1 ? this.linesets[elementIndex] : [];
    } else if (this.addProcessStart && elementIndex === this.addLineElementIndex && this.addLineValueComplete) {
      this.extremities = elementIndex !== -1 ? this.linesets[elementIndex] : [];
    } else if (elementIndex !== -1) {
      this.tempExtremEdit = true;

      this.extremities = this.extendedLinesets[elementIndex];
      this.extremities[0] = this.extremities[0] === 0 ? lineShrink : this.extremities[0];
      this.extremities[1] = this.extremities[1] === 0 ? lineShrink : this.extremities[1];

      if (this.imageDim > 1) {
        this.extremities[2] = this.extremities[2] === 600/this.imageDim ? 600/this.imageDim-lineShrink : this.extremities[2];
        this.extremities[3] = this.extremities[3] === 600 ? 600-lineShrink : this.extremities[3];
      } else {
        this.extremities[2] = this.extremities[2] === 600 ? 600-lineShrink : this.extremities[2];
        this.extremities[3] = this.extremities[3] === 600*this.imageDim ? 600*this.imageDim-lineShrink : this.extremities[3];
      }
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

  public moveSegLine(elementIndex: number, confirmed: boolean): void {
    if (confirmed) {
      this.linesets = this.linesets.filter(e => e !== this.linesets[elementIndex]);
      this.extendedLinesets = this.extendedLinesets.filter(e => e !== this.extendedLinesets[elementIndex]);
      // Seg add a line
    } else {
      this.openDialog('Edit this segmentation line?', 'Use cursor to move the line or key in its new extremities\' coordinates.', elementIndex, 'Edit');
    }
  }

  public lineSwitch(): void {
    this.lineSegment = !this.lineSegment;
  }

  public lineAdd(startProcess: boolean): void {
    if (!startProcess) {
      this.openDialog('Add a segmentation line?', 'Use cursor to place extremities or key in their coordinates.', this.linesets.length + 1, 'Add');
    } else {
      this.processStart = true;
      this.addProcessStart = true;

      this.linesetsBeforeEdit = JSON.parse(JSON.stringify(this.linesets));
      this.extendedLinesetsBeforeEdit = JSON.parse(JSON.stringify(this.extendedLinesets));

      this.addLineElementIndex = this.linesets.length;
    }
  }

  public addLineInputOnKey(placeHolder:string, value: any) {
    switch (placeHolder) {
      case 'firstExtremX':
        this.addFirstExtremX = value;
        break;
      case 'firstExtremY':
        this.addFirstExtremY = value;
        break;
      case 'secondExtremX':
        this.addSecondExtremX = value;
        break;
      case 'secondExtremY':
        this.addSecondExtremY = value;
        break;
      default:
        break;
    }

    if (this.addFirstExtremX && this.addFirstExtremY && this.addSecondExtremX && this.addSecondExtremY) {
      this.addLineValueComplete = true;

      this.addLineProcessShowTempExtremity = false;
      this.addLineTempExtremity = [];

      this.linesets[this.addLineElementIndex] = [this.addFirstExtremX, this.addFirstExtremY, this.addSecondExtremX, this.addSecondExtremY];
      this.extendLineSegments();
    } else {
      this.addLineValueComplete = false;
      delete this.linesets[this.addLineElementIndex];
      delete this.extendedLinesets[this.addLineElementIndex];
      this.linesets.length = this.addLineElementIndex;
      this.extendedLinesets.length = this.addLineElementIndex;

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
  }

  public lineRemove(startProcess: boolean): void {
    if (!startProcess) {
      this.openDialog('Start removing segmentation lines?', 'Use cursor to click on the lines you want to remove.', -1, 'Remove');
    } else {
      this.processStart = true;
      this.removalProcessStart = true;

      this.linesetsBeforeEdit = JSON.parse(JSON.stringify(this.linesets));
      this.extendedLinesetsBeforeEdit = JSON.parse(JSON.stringify(this.extendedLinesets));
    }
  }

  public removeLine(elementIndex: number): void {
    this.linesets = this.linesets.filter(e => e !== this.linesets[elementIndex]);
    this.extendedLinesets = this.extendedLinesets.filter(e => e !== this.extendedLinesets[elementIndex]);

    this.extremities = [];

    console.log('this.linesets');
    console.log(this.linesets);
    console.log('this.extendedLinesets');
    console.log(this.extendedLinesets);
  }
  
  public segConfirm(): void {
    this.openDialog('Proceed with this room segmentaion result?', 'Press cancel if you want to make further changes.', -1, 'Proceed');
  }

  private openDialog(title: string, content: string, elementIndex: number, action: string): void {
    const dialogConfig = new MatDialogConfig();

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
            this.moveSegLine(elementIndex, true)
            break;
          case 'Add':
            this.lineAdd(true);
            break;
          case 'Remove':
            this.lineRemove(true);
            break;
          case 'Proceed':
            break;
          default:
            console.warn('The indicated action is not in the action list!');
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
    if (this.addProcessStart) {
      this.addProcessStart = false;
      this.addFirstExtremX = undefined;
      this.addFirstExtremY = undefined;
      this.addSecondExtremX = undefined;
      this.addSecondExtremY = undefined;
      this.addLineValueComplete = false;
      this.addLineTempExtremity = [];
    } else if (this.removalProcessStart) {
      this.removalProcessStart = false;
    }
  }
}

// TO DOs:
// Add a control so that the add, remove, confirm result button cannot be active together
// Add input error situation (limit input to be a numeric value)

// console.log('*******************************')
// console.log('this.linesets');
// console.log(this.linesets);
// console.log('this.extendedLinesets');
// console.log(this.extendedLinesets);
// console.log('this.linesetsBeforeEdit');
// console.log(this.linesetsBeforeEdit);
// console.log('this.extendedLinesetsBeforeEdit');
// console.log(this.extendedLinesetsBeforeEdit);