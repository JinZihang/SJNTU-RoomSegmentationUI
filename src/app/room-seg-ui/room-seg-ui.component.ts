import { Component, OnInit, AfterViewInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, Inject, Renderer2, ɵɵsetComponentScope } from '@angular/core';
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
  // @Input() imgSrc: string;
  // @Input() lineSet: number[][];

  @Output() segmentationComplete = new EventEmitter<number[][]>();

  canvasSideLength: number = 600;
  beforeResizeCanvasSideLength: number;
  resizeProcess: boolean = false;
  beforeResizeCursorPositionX: number;
  beforeResizeCursorPositionY: number;

  imgSrc: string = '/assets/mock-image-2.png';
  imgScale: number[];

  lineSet: number[][] = linesetData;
  lineSetExtended: number[][];
  lineSetToggle: boolean = false;
  lineSetToDisplay: number[][] = this.lineSet;

  processInfo: any[] = ['']; // Action, action description, line index. Check if this is necessary after finishing the line edit function.
  processCanConfirm: boolean = true;
  lineSetBeforeProcess: number[][];

  @ViewChild('resizeContainerElement') resizeContainerElement: ElementRef;
  @ViewChild('displayElement') displayElement: ElementRef;
  @ViewChild('actionBtnContainerElement') actionBtnContainerElement: ElementRef;
  @ViewChild('processBtnContainerElement') processBtnContainerElement: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  // Initialize.
  ngAfterViewInit(): void {
    this.setContainerPosition();
  }
  private setContainerPosition(): void {
    this.renderer.setStyle(this.resizeContainerElement.nativeElement, 'height', String(this.canvasSideLength) + 'px');
    this.renderer.setStyle(this.resizeContainerElement.nativeElement, 'width', String(this.canvasSideLength) + 'px');

    this.renderer.setStyle(this.actionBtnContainerElement.nativeElement, 'left', String(this.canvasSideLength + 30) + 'px');

    this.renderer.setStyle(this.processBtnContainerElement.nativeElement, 'top', String(this.canvasSideLength - 66) + 'px');
    this.renderer.setStyle(this.processBtnContainerElement.nativeElement, 'left', String(this.canvasSideLength + 30) + 'px');
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
    const maxCanvasSideLength = 650;

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
  public getRoomImgScale(imgScale: number[]): void {
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

  // Action buttons' functions.
  public toggleBetweenLineSegmentAndLine(): void {
    this.lineSetToggle = !this.lineSetToggle;
    this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
  }
  public lineAddProcess(processStart: boolean) {
    if (!processStart) {
      this.openDialog(
        'add', 
        'Add a segmentation line?', 
        'Use cursor to place line segments\' extremities or key in their coordinates. (Canvas resize will be disabled through this process.)', 
        -1);
    } else {
      this.processInfo[0] = 'add';
      this.processCanConfirm = false;
    }
  }
  public lineAddProcessControl(lineAddProcessInfo: any) {
    this.processCanConfirm = lineAddProcessInfo[0];
    let lineToBeAdded = lineAddProcessInfo[1];

    if (this.processCanConfirm) {
      if (this.lineSet.length === this.lineSetBeforeProcess.length) {
        this.lineSet.push(lineToBeAdded);
      } else {
        this.lineSet[this.lineSetBeforeProcess.length] = lineToBeAdded;
      }
      
      this.extendLineSet();
      this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;

      this.lineSet = this.lineSet.slice(); // The ngOnChanges in the display component only listen for reference changes. 
                                           // Thus this step is necessary for triggering the ngOnChanges in the display component.
    } else {
      if (this.lineSet.length !== this.lineSetBeforeProcess.length) {
        delete this.lineSet[this.lineSetBeforeProcess.length];
        this.lineSet.length = this.lineSetBeforeProcess.length;
        this.extendLineSet();
        this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;

        this.lineSet = this.lineSet.slice();
      }
    }
  }
  public lineRemoveProcess(processStart: boolean) {
    if (!processStart) {
      this.openDialog('remove', 'Start removing segmentation lines?', 'Click on the lines that you want to remove.', -1);
    } else {
      this.processInfo[0] = 'remove';
    }
  }
  public completeSegmentation(): void {
    this.openDialog('Complete', 'Proceed with this room segmentaion result?', 'Press cancel if you want to make further edits.', -1);
  }
  private openDialog(action: string, title: string, content: string, lineIndex: number): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '50%';
    dialogConfig.disableClose = true;
    dialogConfig.data = {
      title: title,
      content: content,
      lineIndex: lineIndex,
      action: action
    };

    let dialogRef = this.dialog.open(RoomSegDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      let shouldProceed = result[0];
      let action = result[1];
      let lineIndex = result[2];

      if (shouldProceed) {
        this.lineSetBeforeProcess = JSON.parse(JSON.stringify(this.lineSet));

        switch (action) {
          case 'add':
            this.lineAddProcess(true);
            break;
          case 'remove':
            this.lineRemoveProcess(true);
            break;
          case 'complete':
            this.segmentationComplete.emit(this.lineSet);
            // Jump to the next page.
            break;
        }
      }
    });
  }
  public processControl(confirmChanges: boolean): void {
    this.processInfo = [''];
    this.processCanConfirm = true;

    if (!confirmChanges) {
      this.lineSet = JSON.parse(JSON.stringify(this.lineSetBeforeProcess));
      this.extendLineSet();
      this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
    }
  }
  public updateLineSet(editResult: any[]): void {
    let action = editResult[0];
    let lineIndex = editResult[1];

    switch (action) {
      case 'remove':
        this.lineSet = this.lineSet.filter(e => e !== this.lineSet[lineIndex]);
        this.extendLineSet();
        this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
        break;
    }
  }
}