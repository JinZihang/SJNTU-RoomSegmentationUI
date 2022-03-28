import { Component, OnInit, Input, ViewChild, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { ProjectFile, DisplayElementsDimensions, Coordinate, RoomSegEditProcess, RoomSegMoveLineProcessInfo, RoomSegCursorCoorInfo, RoomSegEditSelection } from '../shared-ui.type';
import { AiProcessTask } from 'src/app/business-core/business-core.type';
import { AwsService } from 'src/app/shared-cloud/aws.service';
import { BcService } from 'src/app/business-core/bc.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-room-seg-editor',
  templateUrl: './room-seg-editor.component.html',
  styleUrls: ['./room-seg-editor.component.scss']
})
export class RoomSegEditorComponent implements AfterViewInit {
  @Input() backgroundFile?: ProjectFile;
  aiTask?: AiProcessTask;

  @ViewChild("buttonContainer") buttonContainer?: ElementRef;
  @ViewChild("inputContainer") inputContainer?: ElementRef;

  imgSrc?: string;
  elementsDims?: DisplayElementsDimensions;

  sessionStorageLineSet: string = "lineSet-id";
  lineSet: number[][] = new Array<Array<number>>();
  lineSetExtended: number[][] = new Array<Array<number>>();
  lineSetToDisplay: number[][] = new Array<Array<number>>();
  displayExtendedLineSet: boolean = false;

  showCursorCoor: boolean = false;
  cursorCoor?: Coordinate;

  process: RoomSegEditProcess = "None";
  lineSetBeforeProcess: number[][] = new Array<Array<number>>();
  lineBeingEditedIndex: number = 0;
  lineBeingEditedIsComplete: boolean = false;
  moveLineProcessInfo?: RoomSegMoveLineProcessInfo;
  lineSetBeforeMoveProcess: number[][] = new Array<Array<number>>();
  updateTriggerer: boolean = false;
  alert: any;

  firstExtremXValue: number = 0;
  firstExtremYValue: number = 0;
  secondExtremXValue: number = 0;
  secondExtremYValue: number = 0;

  isFirstExtremXTouched: boolean = false;
  isFirstExtremYTouched: boolean = false;
  isSecondExtremXTouched: boolean = false;
  isSecondExtremYTouched: boolean = false;

  isFirstExtremXValid: boolean = false;
  isFirstExtremYValid: boolean = false;
  isSecondExtremXValid: boolean = false;
  isSecondExtremYValid: boolean = false;

  title: string = "Room Segmentation Editor";

  constructor(
    private aws: AwsService,
    private bc: BcService,
    private renderer: Renderer2,
    private modalService: NgbModal
  ) {
  }
  closeModal(): void {
    this.modalService.dismissAll();
  }

  ngAfterViewInit(): void {
    this.aws.getObjectUrl(this.backgroundFile.s3Key, this.backgroundFile.contentType, 1).then(url => {
      this.imgSrc = url;
    })
      .catch(error => {
        console.error("Get CC Background image error: ", error);
      });

    this.sessionStorageLineSet += this.backgroundFile.aiProcessTaskId;
    if (sessionStorage.getItem(this.sessionStorageLineSet) === null) {
      this.bc.getAiProcessTaskById(this.backgroundFile.aiProcessTaskId).subscribe(data => {
        this.aiTask = data;
        if (this.aiTask.lineSetJson) {
          this.lineSet = this.aiTask.lineSetJson == "null" ? [] : <number[][]>JSON.parse(this.aiTask.lineSetJson);
          this.lineSetToDisplay = this.lineSet;
        } else {
          console.error("AI Process task has no line set!");
        }
      }, error => {
        console.error("Get AI Process task error: ", error);
      })
    } else {
      this.lineSet = JSON.parse(sessionStorage.getItem(this.sessionStorageLineSet));
      this.lineSetToDisplay = this.lineSet;
    }
  }

  public getDisplayElementsDimensions(elementsDims: DisplayElementsDimensions): void {
    this.elementsDims = elementsDims;

    this.adjustContainers();
    this.extendLineSegments();
  }
  private adjustContainers(): void {
    if (this.process === "Add") {
      this.renderer.setStyle(this.inputContainer.nativeElement, "margin-bottom", "10px");
    } else {
      this.renderer.removeStyle(this.inputContainer.nativeElement, "margin-bottom");
    }

    this.renderer.setStyle(this.inputContainer.nativeElement, "width", `${this.elementsDims.containerDimension.x}px`)
    this.renderer.setStyle(this.buttonContainer.nativeElement, "height", `${this.elementsDims.containerDimension.y}px`)
  }
  private extendLineSegments(): void {
    const xMax = this.elementsDims.imgDimension.x;
    const yMax = this.elementsDims.imgDimension.y;

    this.lineSetExtended = [];

    for (let i = 0; i < this.lineSet.length; i++) {
      // The equation of line is "y = (x-x1) * (y1-y2)/(x1-x2) + y1" ("x = (y-y1) * (x1-x2)/(y1-y2) + x1").
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
          const yAtx0 = x1 * (y2 - y1) / (x1 - x2) + y1;
          const yAtxMax = (xMax - x1) * (y1 - y2) / (x1 - x2) + y1;
          const xAty0 = y1 * (x2 - x1) / (y1 - y2) + x1;
          const xAtyMax = (yMax - y1) * (x1 - x2) / (y1 - y2) + x1;

          if (yAtx0 < 0) {
            if (yAtxMax < 0) {
              console.error("Failed extending line " + i + ": ", this.lineSet[i]);
            } else if (yAtxMax > yMax) {
              this.lineSetExtended.push([xAty0, 0, xAtyMax, yMax]);
            } else {
              this.lineSetExtended.push([xAty0, 0, xMax, yAtxMax]);
            }
          } else if (yAtx0 > yMax) {
            if (yAtxMax < 0) {
              this.lineSetExtended.push([xAtyMax, yMax, xAty0, 0]);
            } else if (yAtxMax > yMax) {
              console.error("Failed extending line " + i + ": ", this, this.lineSet[i]);
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

    this.lineSetToDisplay = this.displayExtendedLineSet ? this.lineSetExtended : this.lineSet;
  }

  public closeAlert(alert: any): void {
    this.alert = null;
  }
  public updateCursorCoordinates(cursorCoorInfo: RoomSegCursorCoorInfo): void {
    this.showCursorCoor = cursorCoorInfo.showCursor;
    if (cursorCoorInfo.showCursor) {
      this.cursorCoor = cursorCoorInfo.cursorCoor;

      if (this.process === "Add" && this.moveLineProcessInfo !== undefined) {
        this.moveLine();
      }
    }
  }
  public toggleLineSetToDisplay(): void {
    this.displayExtendedLineSet = !this.displayExtendedLineSet;
    this.lineSetToDisplay = this.displayExtendedLineSet ? this.lineSetExtended : this.lineSet;
  }
  public activateProcess(process: RoomSegEditProcess): void {
    this.process = process;
    this.lineSetBeforeProcess = JSON.parse(JSON.stringify(this.lineSet));
    this.adjustContainers();
    if (process === "Add") {
      this.lineBeingEditedIndex = this.lineSet.length;
      this.lineSet.push([-1, -1, -1, -1]);
      this.lineSetExtended.push([-1, -1, -1, -1]);
    } else if (process === "Edit") {
      this.firstExtremXValue = this.lineSetBeforeProcess[this.lineBeingEditedIndex][0];
      this.firstExtremYValue = this.lineSetBeforeProcess[this.lineBeingEditedIndex][1];
      this.secondExtremXValue = this.lineSetBeforeProcess[this.lineBeingEditedIndex][2];
      this.secondExtremYValue = this.lineSetBeforeProcess[this.lineBeingEditedIndex][3];
      this.process = "Add";
    }
  }
  public confrimSegmentationResult(): void {
    this.aiTask.lineSetJson = JSON.stringify(this.lineSet);
    this.bc.updateAiProcessTask(this.aiTask).pipe(
      switchMap(() => {
        return this.bc.completeRoomSegCorrection(this.aiTask.id);
      })
    ).subscribe(countSubTasks => {
      if (countSubTasks == 0) {
        this.alert = {
          type: "info",
          message: "Room Segmentation updated, but there seems to be no further AI processing."
        };
      }
      else {
        this.alert = {
          type: "success",
          message: "Room Segmentation updated, AI will continue processing."
        };
      }
    }, err =>
      this.alert = {
        type: "danger",
        message: "Room Segmentation failed: " + err
      })
    sessionStorage.removeItem(this.sessionStorageLineSet);
  }
  public processControl(applyEdit: boolean): void {
    this.process = "None";
    this.lineBeingEditedIsComplete = false;
    delete this.firstExtremXValue;
    delete this.firstExtremYValue;
    delete this.secondExtremXValue;
    delete this.secondExtremYValue;
    this.isFirstExtremXTouched = false;
    this.isFirstExtremYTouched = false;
    this.isSecondExtremXTouched = false;
    this.isSecondExtremYTouched = false;
    this.isFirstExtremXValid = false;
    this.isFirstExtremYValid = false;
    this.isSecondExtremXValid = false;
    this.isSecondExtremYValid = false;

    sessionStorage.setItem(this.sessionStorageLineSet, JSON.stringify(this.lineSet));

    if (!applyEdit) {
      this.lineSet = JSON.parse(JSON.stringify(this.lineSetBeforeProcess));
      this.extendLineSegments();
    }
    this.adjustContainers();
  }
  private triggerUpdate(): void {
    this.updateTriggerer = !this.updateTriggerer;
  }

  public inputOnKey(placeHolder: string, value: string): void {
    switch (placeHolder) {
      case "firstExtremX":
        this.isFirstExtremXTouched = value === "" ? false : true;
        if (value === "" || Number(value) < 0 || Number(value) > this.elementsDims.imgDimension.x) {
          this.lineSet[this.lineBeingEditedIndex][0] = -1;
          this.lineSetExtended[this.lineBeingEditedIndex][0] = -1;
          this.isFirstExtremXValid = false;
        } else {
          this.lineSet[this.lineBeingEditedIndex][0] = Number(value);
          this.lineSetExtended[this.lineBeingEditedIndex][0] = Number(value);
          this.isFirstExtremXValid = true;
        }
        break;
      case "firstExtremY":
        this.isFirstExtremYTouched = value === "" ? false : true;
        if (value === "" || Number(value) < 0 || Number(value) > this.elementsDims.imgDimension.y) {
          this.lineSet[this.lineBeingEditedIndex][1] = -1;
          this.lineSetExtended[this.lineBeingEditedIndex][1] = -1;
          this.isFirstExtremYValid = false;
        } else {
          this.lineSet[this.lineBeingEditedIndex][1] = Number(value);
          this.lineSetExtended[this.lineBeingEditedIndex][1] = Number(value);
          this.isFirstExtremYValid = true;
        }
        break;
      case "secondExtremX":
        this.isSecondExtremXTouched = value === "" ? false : true;
        if (value === "" || Number(value) < 0 || Number(value) > this.elementsDims.imgDimension.x) {
          this.lineSet[this.lineBeingEditedIndex][2] = -1;
          this.lineSetExtended[this.lineBeingEditedIndex][2] = -1;
          this.isSecondExtremXValid = false;
        } else {
          this.lineSet[this.lineBeingEditedIndex][2] = Number(value);
          this.lineSetExtended[this.lineBeingEditedIndex][2] = Number(value);
          this.isSecondExtremXValid = true;
        }
        break;
      case "secondExtremY":
        this.isSecondExtremYTouched = value === "" ? false : true;
        if (value === "" || Number(value) < 0 || Number(value) > this.elementsDims.imgDimension.y) {
          this.lineSet[this.lineBeingEditedIndex][3] = -1;
          this.lineSetExtended[this.lineBeingEditedIndex][3] = -1;
          this.isSecondExtremYValid = false;
        } else {
          this.lineSet[this.lineBeingEditedIndex][3] = Number(value);
          this.lineSetExtended[this.lineBeingEditedIndex][3] = Number(value);
          this.isSecondExtremYValid = true;
        }
        break;
    }

    if (this.lineSet[this.lineBeingEditedIndex][0] !== -1 && this.lineSet[this.lineBeingEditedIndex][1] !== -1 && this.lineSet[this.lineBeingEditedIndex][2] !== -1 && this.lineSet[this.lineBeingEditedIndex][3] !== -1) {
      this.lineBeingEditedIsComplete = true;
      this.extendLineSegments();
    } else {
      this.lineBeingEditedIsComplete = false;
    }

    this.lineSetToDisplay = this.displayExtendedLineSet ? this.lineSetExtended : this.lineSet;
    this.triggerUpdate();
  }
  public onCanvasClickReceive(): void {
    if (this.process === "Add") {
      this.fillLineExtremities();
    }
  }
  private fillLineExtremities(): void {
    if (!this.lineBeingEditedIsComplete) {
      if (this.lineSet[this.lineBeingEditedIndex][0] < 0 || this.lineSet[this.lineBeingEditedIndex][1] < 0) {
        this.firstExtremXValue = this.cursorCoor.x;
        this.firstExtremYValue = this.cursorCoor.y;
        this.inputOnKey("firstExtremX", String(this.cursorCoor.x));
        this.inputOnKey("firstExtremY", String(this.cursorCoor.y));
      } else if (this.lineSet[this.lineBeingEditedIndex][2] < 0 || this.lineSet[this.lineBeingEditedIndex][3] < 0) {
        this.secondExtremXValue = this.cursorCoor.x;
        this.secondExtremYValue = this.cursorCoor.y;
        this.inputOnKey("secondExtremX", String(this.cursorCoor.x));
        this.inputOnKey("secondExtremY", String(this.cursorCoor.y));
      }

      this.triggerUpdate();
    }
  }
  public autoLineAlign(basedOnFirstExtremity: boolean): void {
    const alignHorizontally = Math.abs(
      this.lineSet[this.lineBeingEditedIndex][0] - this.lineSet[this.lineBeingEditedIndex][2])
      > Math.abs(this.lineSet[this.lineBeingEditedIndex][1] - this.lineSet[this.lineBeingEditedIndex][3]);

    if (basedOnFirstExtremity) {
      if (alignHorizontally) {
        this.secondExtremYValue = this.lineSet[this.lineBeingEditedIndex][1];
        this.inputOnKey("secondExtremY", String(this.lineSet[this.lineBeingEditedIndex][1]));
      } else {
        this.secondExtremXValue = this.lineSet[this.lineBeingEditedIndex][0];
        this.inputOnKey("secondExtremX", String(this.lineSet[this.lineBeingEditedIndex][0]));
      }
    } else {
      if (alignHorizontally) {
        this.firstExtremYValue = this.lineSet[this.lineBeingEditedIndex][3];
        this.inputOnKey("firstExtremY", String(this.lineSet[this.lineBeingEditedIndex][3]));
      } else {
        this.firstExtremXValue = this.lineSet[this.lineBeingEditedIndex][2];
        this.inputOnKey("firstExtremX", String(this.lineSet[this.lineBeingEditedIndex][2]));
      }
    }

    this.extendLineSegments();
  }
  public moveLineProcessControl(element: RoomSegEditSelection): void {
    if (element !== "None") {
      this.moveLineProcessInfo = {
        element: element,
        initialCursorCoor: {
          x: Number(String(this.cursorCoor.x)),
          y: Number(String(this.cursorCoor.y))
        }
      };
      this.lineSetBeforeMoveProcess = JSON.parse(JSON.stringify(this.lineSet));
    } else {
      delete this.moveLineProcessInfo;
      delete this.lineSetBeforeMoveProcess;
    }
  }
  private moveLine(): void {
    const xDisplacement = this.cursorCoor.x - this.moveLineProcessInfo.initialCursorCoor.x;
    const yDisplacement = this.cursorCoor.y - this.moveLineProcessInfo.initialCursorCoor.y;

    switch (this.moveLineProcessInfo.element) {
      case "Line":
        const firstExtremXAfterDisplacement = this.lineSetBeforeMoveProcess[this.lineBeingEditedIndex][0] + xDisplacement;
        const firstExtremYAfterDisplacement = this.lineSetBeforeMoveProcess[this.lineBeingEditedIndex][1] + yDisplacement;
        const secondExtremXAfterDisplacement = this.lineSetBeforeMoveProcess[this.lineBeingEditedIndex][2] + xDisplacement;
        const secondExtremYAfterDisplacement = this.lineSetBeforeMoveProcess[this.lineBeingEditedIndex][3] + yDisplacement;

        if (firstExtremXAfterDisplacement >= 0 && firstExtremXAfterDisplacement <= this.elementsDims.imgDimension.x
          && firstExtremYAfterDisplacement >= 0 && firstExtremYAfterDisplacement <= this.elementsDims.imgDimension.y
          && secondExtremXAfterDisplacement >= 0 && secondExtremXAfterDisplacement <= this.elementsDims.imgDimension.x
          && secondExtremYAfterDisplacement >= 0 && secondExtremYAfterDisplacement <= this.elementsDims.imgDimension.y) {
          this.firstExtremXValue = firstExtremXAfterDisplacement;
          this.firstExtremYValue = firstExtremYAfterDisplacement;
          this.secondExtremXValue = secondExtremXAfterDisplacement;
          this.secondExtremYValue = secondExtremYAfterDisplacement;
          this.inputOnKey("firstExtremX", String(firstExtremXAfterDisplacement));
          this.inputOnKey("firstExtremY", String(firstExtremYAfterDisplacement));
          this.inputOnKey("secondExtremX", String(secondExtremXAfterDisplacement));
          this.inputOnKey("secondExtremY", String(secondExtremYAfterDisplacement));
          this.triggerUpdate();
        }
        break;

      case "FirstExtrem":
        this.firstExtremXValue = this.cursorCoor.x;
        this.firstExtremYValue = this.cursorCoor.y;
        this.inputOnKey("firstExtremX", String(this.cursorCoor.x));
        this.inputOnKey("firstExtremY", String(this.cursorCoor.y));
        this.triggerUpdate();
        break;

      case "SecondExtrem":
        this.secondExtremXValue = this.cursorCoor.x;
        this.secondExtremYValue = this.cursorCoor.y;
        this.inputOnKey("secondExtremX", String(this.cursorCoor.x));
        this.inputOnKey("secondExtremY", String(this.cursorCoor.y));
        this.triggerUpdate();
        break;
    }
  }
  private removeLine(lineIndex: number): void {
    this.lineSet = this.lineSet.filter(e => e !== this.lineSet[lineIndex]);
    this.extendLineSegments();
  }
  public onLineIndexReceive(lineIndex: number): void {
    switch (this.process) {
      case "Remove":
        this.removeLine(lineIndex);
        break;
      case "None":
        this.lineBeingEditedIndex = lineIndex;
        this.activateProcess("Edit");
        this.lineBeingEditedIsComplete = true;
        break;
    }
  }
}
