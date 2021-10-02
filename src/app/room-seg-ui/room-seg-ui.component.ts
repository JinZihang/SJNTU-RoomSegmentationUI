import { Component, AfterViewInit, Output, EventEmitter, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { RoomSegDialogComponent } from './room-seg-dialog/room-seg-dialog.component';
import { ProcessInfo, LineAddProcessInfo } from './room-segmentation';
import linesetData from '../../assets/mock-lineset-1.json';

@Component({
  selector: 'room-seg-ui',
  templateUrl: 'room-seg-ui.component.html',
  styleUrls: ['room-seg-ui.component.css']
})
export class RoomSegUIComponent implements AfterViewInit {
  // @Input() imgSrc: string;
  // @Input() lineSet: number[][];

  @Output() segmentationComplete = new EventEmitter<number[][]>(); // Final segmentation line set.

  pageTopDistance: number = 10; // Constant.
  pageLeftDistance: number = 15; // Constant.
  historyContainerWidth: number = 40;
  canvasSideLength: number = 600;

  showEditHistory: boolean;

  resizeProcess: boolean = false;
  resizeTriggeringElement: string;
  beforeResizeHistoryContainerWidth: number;
  beforeResizeCanvasSideLength: number;
  beforeResizeCursorPositionX: number;
  beforeResizeCursorPositionY: number;
  afterResizeHistoryContainerWidth: number;

  imgSrc: string = '/assets/mock-image-1.png';
  imgScale: number[];

  lineSet: number[][] = linesetData;
  lineSetExtended: number[][];
  lineSetToggle: boolean = false;
  lineSetToDisplay: number[][] = this.lineSet;

  processInfo: ProcessInfo = { action: 'none' };
  updateTriggerer: string = 'Triggering updates.';
  processCanConfirm: boolean = true;
  lineSetBeforeProcess: number[][];

  @ViewChild('historyResizeContainerElement') historyResizeContainerElement: ElementRef;
  @ViewChild('displayResizeContainerElement') displayResizeContainerElement: ElementRef;
  @ViewChild('displayElement') displayElement: ElementRef;
  @ViewChild('actionBtnContainerElement') actionBtnContainerElement: ElementRef;
  @ViewChild('processBtnContainerElement') processBtnContainerElement: ElementRef;

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  // Initialize.
  ngAfterViewInit(): void {
    this.setContainersPositions();
  }
  private setContainersPositions(): void {
    this.renderer.setStyle(this.historyResizeContainerElement.nativeElement, 'top', String(this.pageTopDistance) + 'px');
    this.renderer.setStyle(this.historyResizeContainerElement.nativeElement, 'left', String(this.pageLeftDistance) + 'px');
    this.renderer.setStyle(this.historyResizeContainerElement.nativeElement, 'width', String(this.historyContainerWidth) + 'px');

    this.renderer.setStyle(this.displayResizeContainerElement.nativeElement, 'top', String(this.pageTopDistance) + 'px');
    this.renderer.setStyle(this.displayResizeContainerElement.nativeElement, 'left', String(this.pageLeftDistance + this.historyContainerWidth + 20) + 'px');
    this.renderer.setStyle(this.displayResizeContainerElement.nativeElement, 'height', String(this.canvasSideLength) + 'px');
    this.renderer.setStyle(this.displayResizeContainerElement.nativeElement, 'width', String(this.canvasSideLength) + 'px');

    this.renderer.setStyle(this.actionBtnContainerElement.nativeElement, 'top', String(this.pageTopDistance) + 'px');
    this.renderer.setStyle(this.actionBtnContainerElement.nativeElement, 'left', String(this.pageLeftDistance + this.historyContainerWidth + this.canvasSideLength + 40) + 'px');

    this.renderer.setStyle(this.processBtnContainerElement.nativeElement, 'top', String(this.pageTopDistance + this.canvasSideLength - 81) + 'px');
    this.renderer.setStyle(this.processBtnContainerElement.nativeElement, 'left', String(this.pageLeftDistance + this.historyContainerWidth + this.canvasSideLength + 40) + 'px');
  }

  // History list related.
  public displayEditHistory(): void {
    this.showEditHistory = !this.showEditHistory;

    if (this.showEditHistory) {
      this.historyContainerWidth = this.afterResizeHistoryContainerWidth || 200;
    } else {
      this.afterResizeHistoryContainerWidth = this.historyContainerWidth;
      this.historyContainerWidth = 40;
    }
    this.setContainersPositions()
  }

  // For resizing containers.
  public resizeContainerControl(event: any, resizeProcess: boolean, resizeTriggeringElement: string): void {
    this.resizeProcess = resizeProcess;
    this.resizeTriggeringElement = this.resizeProcess ? resizeTriggeringElement : '';

    this.beforeResizeHistoryContainerWidth = this.historyContainerWidth;
    this.beforeResizeCanvasSideLength = this.canvasSideLength;
    this.beforeResizeCursorPositionX = event.clientX;
    this.beforeResizeCursorPositionY = event.clientY;
  }
  @HostListener('document:mousemove', ['$event']) onMouseMove(mouseMovementListener: any) {
    if (this.resizeProcess) {
      this.resizeContainer(mouseMovementListener);
    }
  }
  public resizeContainer(event: any): void {
    const minHistoryContainerWdith = 100;
    const maxHistoryContainerWdith = 300;
    const minCanvasSideLength = 300;
    const maxCanvasSideLength = 650;

    if (this.resizeProcess) {
      if (this.resizeTriggeringElement === 'history-right') { // Resize the history container.
        if (this.historyContainerWidth >= minHistoryContainerWdith && this.historyContainerWidth <= maxHistoryContainerWdith) {
          this.historyContainerWidth = this.beforeResizeHistoryContainerWidth + (event.clientX - this.beforeResizeCursorPositionX);
        } else if (this.historyContainerWidth < minHistoryContainerWdith) {
          if (event.clientX - this.beforeResizeCursorPositionX > 0) {
            this.historyContainerWidth = this.beforeResizeHistoryContainerWidth + (event.clientX - this.beforeResizeCursorPositionX);
          } else {
            this.resizeProcess = false;
          }
        } else {
          if (event.clientX - this.beforeResizeCursorPositionX < 0) {
            this.historyContainerWidth = this.beforeResizeHistoryContainerWidth + (event.clientX - this.beforeResizeCursorPositionX);
          } else {
            this.resizeProcess = false;
          }
        }
      } else { // Resize the area to display image and line set.
        if (this.canvasSideLength >= minCanvasSideLength && this.canvasSideLength <= maxCanvasSideLength) {
          switch (this.resizeTriggeringElement) {
            case 'display-bottom':
              this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientY - this.beforeResizeCursorPositionY);
              break;
            case 'display-right':
              this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientX - this.beforeResizeCursorPositionX);
              break;
          }
        } else if (this.canvasSideLength < minCanvasSideLength) {
          switch (this.resizeTriggeringElement) {
            case 'display-bottom':
              if (event.clientY - this.beforeResizeCursorPositionY > 0) {
                this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientY - this.beforeResizeCursorPositionY);
              } else {
                this.resizeProcess = false;
              }
              break;
            case 'display-right':
              if (event.clientX - this.beforeResizeCursorPositionX > 0) {
                this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientX - this.beforeResizeCursorPositionX);
              } else {
                this.resizeProcess = false;
              }
              break;
          }
        } else {
          switch (this.resizeTriggeringElement) {
            case 'display-bottom':
              if (event.clientY - this.beforeResizeCursorPositionY < 0) {
                this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientY - this.beforeResizeCursorPositionY);
              } else {
                this.resizeProcess = false;
              }
              break;
            case 'display-right':
              if (event.clientX - this.beforeResizeCursorPositionX < 0) {
                this.canvasSideLength = this.beforeResizeCanvasSideLength + (event.clientX - this.beforeResizeCursorPositionX);
              } else {
                this.resizeProcess = false;
              }
              break;
          }
        }
      }
      
      
      this.setContainersPositions();
    }
  }
  
  // For extending line segments to lines.
  public getRoomImgScale(imgScale: number[]): void {
    this.imgScale = imgScale;
    this.extendLineSegments();
  }
  private extendLineSegments(): void {
    const xMax = this.imgScale[0];
    const yMax = this.imgScale[1];

    this.lineSetExtended = [];

    for (let i=0; i<this.lineSet.length; i++) {
      // The equation of line is 'y = (x-x1) * (y1-y2)/(x1-x2) + y1' ('x = (y-y1) * (x1-x2)/(y1-y2) + x1').
      const x1 = this.lineSet[i][0];
      const y1 = this.lineSet[i][1];
      const x2 = this.lineSet[i][2];
      const y2 = this.lineSet[i][3];
       
      if (x1 === x2) {
        this.lineSetExtended.push([x1, 0, x1, yMax]);
      } else {
        if (y1 === y2) {
          this.lineSetExtended.push([0, y1, xMax, y1]);
        } else {
          const yAtx0 = x1 * (y2-y1)/(x1-x2) + y1;
          const yAtxMax = (xMax-x1) * (y1-y2)/(x1-x2) + y1;
          const xAty0 = y1 * (x2-x1)/(y1-y2) + x1;
          const xAtyMax = (yMax-y1) * (x1-x2)/(y1-y2) + x1;

          if (yAtx0 < 0) {
            if (yAtxMax < 0) {
              console.error('extendLineSegments(): error from line ' + i + '!');
            } else if (yAtxMax > yMax) {
              this.lineSetExtended.push([xAty0, 0, xAtyMax, yMax]);
            } else {
              this.lineSetExtended.push([xAty0, 0, xMax, yAtxMax]);
            }
          } else if (yAtx0 > yMax) {
            if (yAtxMax < 0) {
              this.lineSetExtended.push([xAtyMax, yMax, xAty0, 0]);
            } else if (yAtxMax > yMax) {
              console.error('extendLineSegments(): error from line ' + i + '!');
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
  public toggleBetweenLineSegmentsAndLines(): void {
    this.lineSetToggle = !this.lineSetToggle;
    this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
  }
  public lineAddProcess(processStart: boolean, lineIndex: number) {
    if (!processStart) {
      this.openDialog(
        'add', 
        'Add a segmentation line?', 
        'Use cursor to place line segments\' extremities or key in their coordinates. (Canvas resize will be disabled through this process.)', 
        -1);
    } else {
      this.processInfo.action = 'add';
      this.processInfo.lineIndex = lineIndex;
      this.processCanConfirm = false;

      this.forceUpdate();
    }
  }
  public lineAddProcessControl(lineAddProcessInfo: LineAddProcessInfo) {
    this.processCanConfirm = lineAddProcessInfo.isLineToBeAddedComplete;
    const fromLineEditProcess = lineAddProcessInfo.isTriggeredByLineEditProcess;
    const lineToBeAdded = lineAddProcessInfo.lineToBeAdded;

    const lineSetLengthBeforeAddProcess = fromLineEditProcess ? this.lineSetBeforeProcess.length - 1: this.lineSetBeforeProcess.length;
    
    if (this.processCanConfirm) {
      if (this.lineSet.length === lineSetLengthBeforeAddProcess) {
        this.lineSet.push(lineToBeAdded);
      } else {
        this.lineSet[this.lineSet.length - 1] = lineToBeAdded;
      }
      
      this.extendLineSegments();
      this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;

      this.forceUpdate();
    } else {
      if (this.lineSet.length !== lineSetLengthBeforeAddProcess) {
        delete this.lineSet[this.lineSet.length - 1];
        this.lineSet.length = lineSetLengthBeforeAddProcess;
        this.extendLineSegments();
        this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;

        this.forceUpdate();
      }
    }
  }
  public lineRemoveProcess(processStart: boolean) {
    if (!processStart) {
      this.openDialog('remove', 'Start removing segmentation lines?', 'Click on the lines that you want to remove.', -1);
    } else {
      this.processInfo.action = 'remove';
    }
  }
  public lineEditProcess(processStart: boolean, lineIndex: number) {
    if (!processStart) {
      this.openDialog(
        'edit', 
        'Edit this segmentation line?', 
        'Use cursor to set or key in its new extremities\' coordinates. (Canvas resize will be disabled through this process.)', 
        lineIndex);
    } else {
      this.processInfo.action = 'edit';
      this.processInfo.lineIndex = lineIndex;

      this.updateLineSet({
        action: 'remove',
        lineIndex: lineIndex
      });
    }
  }
  public completeSegmentation(): void {
    this.openDialog('complete', 'Proceed with this room segmentaion result?', 'Press cancel if you want to make further edits.', -1);
  }

  // Process controls.
  private openDialog(action: string, title: string, content: string, lineIndex: number): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '50%';
    dialogConfig.autoFocus = false;
    dialogConfig.disableClose = true;
    dialogConfig.data = {
      title: title,
      content: content,
      lineIndex: lineIndex,
      action: action
    };

    const dialogRef = this.dialog.open(RoomSegDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      const shouldProceed = result[0];
      const action = result[1];
      const lineIndex = result[2];

      if (shouldProceed) {
        this.lineSetBeforeProcess = JSON.parse(JSON.stringify(this.lineSet));

        switch (action) {
          case 'add':
            this.lineAddProcess(true, -1);
            break;
          case 'remove':
            this.lineRemoveProcess(true);
            break;
          case 'edit':
            this.lineEditProcess(true, lineIndex);
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
    this.processInfo = { action: 'none' };
    this.processCanConfirm = true;

    if (!confirmChanges) {
      this.lineSet = JSON.parse(JSON.stringify(this.lineSetBeforeProcess));
      this.extendLineSegments();
      this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
    }
  }
  public updateLineSet(editResult: ProcessInfo): void {
    const action = editResult.action;
    const lineIndex = editResult.lineIndex;

    switch (action) {
      case 'remove':
        if (lineIndex) {
          this.lineSet = this.lineSet.filter(e => e !== this.lineSet[lineIndex]);
          this.extendLineSegments();
          this.lineSetToDisplay = this.lineSetToggle ? this.lineSetExtended : this.lineSet;
        } else {
          console.error('updateLineSet(): line index missing!')
        }
        break;

      case 'edit':
        lineIndex ? this.lineAddProcess(true, lineIndex) : console.error('updateLineSet(): line index missing!');
        break;
    }
  }
  // The ngOnChanges in the display component only listen for reference changes.
  // Thus the following step is sometimes necessary for triggering the ngOnChanges function in the display component.
  public forceUpdate(): void {
    this.updateTriggerer = this.updateTriggerer === 'Triggering updates.' ? 'Igonore this error in the development mode.' : 'Triggering updates.';
  }
}