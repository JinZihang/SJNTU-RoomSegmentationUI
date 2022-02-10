import { Component, OnChanges, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { RoomSegEditProcess, DisplayElementsDimensions, DisplayZoomInfo, Direction, RoomSegCursorCoorInfo, Dimension, RoomSegDisplayCursor, Coordinate, RoomSegEditSelection } from '../shared-ui.type';

@Component({
  selector: 'room-seg-display',
  templateUrl: 'room-seg-display.component.html',
  styleUrls: ['room-seg-display.component.scss']
})
export class RoomSegDisplayComponent implements OnChanges {
  @Input() imgSrc: string;
  @Input() lineSet: number[][];
  @Input() lineSetToDisplay: number[][];
  @Input() lineBeingEditedIndex?: number;
  @Input() process: RoomSegEditProcess;
  @Input() triggerUpdate: boolean;

  @Output() displayElementsDimEmitter = new EventEmitter<DisplayElementsDimensions>();
  @Output() cursorCoorEmitter = new EventEmitter<RoomSegCursorCoorInfo>();
  @Output() canvasClickEmitter = new EventEmitter<null>();
  @Output() lineIndexEmitter = new EventEmitter<number>();
  @Output() elementSelectionEmitter = new EventEmitter<RoomSegEditSelection>();

  @ViewChild("backgroundImage") backgroundImage: ElementRef;
  @ViewChild("displayContainer") displayContainer: ElementRef;
  @ViewChild("displayDimensionContainer") displayDimensionContainer: ElementRef;
  @ViewChild("svgContainer") svgContainer: ElementRef;
  @ViewChild("verticalShiftButtonContainer") verticalShiftButtonContainer: ElementRef;
  @ViewChild("horizontalShiftButtonContainer") horizontalShiftButtonContainer: ElementRef;

  containerDimension: Dimension = { x: 876, y: 500 };
  imgLoaded: boolean = false;
  imgDimension: Dimension;
  dimContainerDimension: Dimension;
  zoomInfo: DisplayZoomInfo = {
    percentage: 1,
    shift: { x: 0, y: 0 },
    display: { x: 0, y: 0 }
  };
  zooming: boolean = false;
  shifting: boolean = false;
  shiftingWithCursor: boolean = false;
  beforeShiftingCursorCoor: Coordinate;
  beforeShiftingZoomInfoShift: Coordinate;

  lineSetCoorAdjusted: number[][];
  lineSetToDisplayCoorAdjusted: number[][];

  extremities: number[] = [];
  lineBeingEditedExtremities: number[] = [];

  canvasCursor: RoomSegDisplayCursor = "Default";
  lineCursor: RoomSegDisplayCursor = "Pointer";
  cursorCoor: Coordinate;

  constructor(private renderer: Renderer2) { }

  ngOnChanges(): void {
    if (this.imgLoaded) {
      this.adjustLineCoordinates();
    }

    if (this.process === "Add") {
      this.lineCursor = "Default";
      if (this.lineSetToDisplay[this.lineBeingEditedIndex][0] < 0 || this.lineSetToDisplay[this.lineBeingEditedIndex][1] < 0
        || this.lineSetToDisplay[this.lineBeingEditedIndex][2] < 0 || this.lineSetToDisplay[this.lineBeingEditedIndex][3] < 0) {
        this.canvasCursor = "Pointer";
        this.lineCursor = "Pointer";
        if (this.lineSetToDisplay[this.lineBeingEditedIndex][0] < 0 && this.lineSetToDisplay[this.lineBeingEditedIndex][1] < 0
          && this.lineSetToDisplay[this.lineBeingEditedIndex][2] < 0 && this.lineSetToDisplay[this.lineBeingEditedIndex][3] < 0) {
          this.lineBeingEditedExtremities = [];
        }
      } else {
        this.canvasCursor = "Default";
        this.lineCursor = "Default";
      }
    } else {
      this.lineBeingEditedExtremities = [];
      this.canvasCursor = "Default";
      this.lineCursor = "Pointer";
    }
  }

  public onImageLoad(): void {
    this.imgLoaded = true;
    this.imgDimension = {
      x: (this.backgroundImage.nativeElement as HTMLImageElement).naturalWidth,
      y: (this.backgroundImage.nativeElement as HTMLImageElement).naturalHeight
    };

    this.adjustContainers();
    this.adjustLineCoordinates();

    this.displayElementsDimEmitter.emit({
      containerDimension: this.containerDimension,
      imgDimension: this.imgDimension
    });
  }
  private adjustContainers(): void {
    this.renderer.setStyle(this.displayContainer.nativeElement, "width", `${this.containerDimension.x}px`);
    this.renderer.setStyle(this.displayContainer.nativeElement, "height", `${this.containerDimension.y}px`);

    let dimContainerX, dimContainerY;
    if (this.imgDimension.x > this.imgDimension.y) {
      dimContainerX = this.containerDimension.x;
      dimContainerY = this.containerDimension.x * this.imgDimension.y / this.imgDimension.x;
    } else {
      dimContainerX = this.containerDimension.y * this.imgDimension.x / this.imgDimension.y;
      dimContainerY = this.containerDimension.y;
    }

    this.dimContainerDimension = { x: dimContainerX, y: dimContainerY };

    this.zoomInfo.display.x = dimContainerX;
    this.zoomInfo.display.y = dimContainerY;

    // 10px from room-seg-display-container's margin
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "top", `${(this.containerDimension.y - dimContainerY) / 2 + 10}px`);
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "left", `${(this.containerDimension.x - dimContainerX) / 2 + 10}px`);
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "width", `${dimContainerX}px`);
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "height", `${dimContainerY}px`);

    this.updateCanvasDisplayArea();

    // 2 * 4 from buttons' margins, 2 from border displacements
    this.renderer.setStyle(this.horizontalShiftButtonContainer.nativeElement, "width", `${this.containerDimension.x - 10}px`);
    this.renderer.setStyle(this.verticalShiftButtonContainer.nativeElement, "height", `${this.containerDimension.y - 10}px`);
  }
  private adjustLineCoordinates(): void {
    this.lineSetCoorAdjusted = JSON.parse(JSON.stringify(this.lineSet));
    this.lineSetToDisplayCoorAdjusted = JSON.parse(JSON.stringify(this.lineSetToDisplay));

    for (let i = 0; i < this.lineSet.length; i++) {
      this.lineSetCoorAdjusted[i][0] = (this.lineSet[i][0] / this.imgDimension.x) * this.zoomInfo.display.x;
      this.lineSetCoorAdjusted[i][1] = (this.lineSet[i][1] / this.imgDimension.y) * this.zoomInfo.display.y;
      this.lineSetCoorAdjusted[i][2] = (this.lineSet[i][2] / this.imgDimension.x) * this.zoomInfo.display.x;
      this.lineSetCoorAdjusted[i][3] = (this.lineSet[i][3] / this.imgDimension.y) * this.zoomInfo.display.y;

      this.lineSetToDisplayCoorAdjusted[i][0] = (this.lineSetToDisplay[i][0] / this.imgDimension.x) * this.zoomInfo.display.x;
      this.lineSetToDisplayCoorAdjusted[i][1] = (this.lineSetToDisplay[i][1] / this.imgDimension.y) * this.zoomInfo.display.y;
      this.lineSetToDisplayCoorAdjusted[i][2] = (this.lineSetToDisplay[i][2] / this.imgDimension.x) * this.zoomInfo.display.x;
      this.lineSetToDisplayCoorAdjusted[i][3] = (this.lineSetToDisplay[i][3] / this.imgDimension.y) * this.zoomInfo.display.y;
    }

    if (this.process === "Add") {
      if (this.lineSetCoorAdjusted[this.lineBeingEditedIndex][0] >= 0 && this.lineSetCoorAdjusted[this.lineBeingEditedIndex][1] >= 0
        && this.lineSetCoorAdjusted[this.lineBeingEditedIndex][2] >= 0 && this.lineSetCoorAdjusted[this.lineBeingEditedIndex][3] >= 0) {
        for (let i = 0; i < 4; i++) {
          this.lineBeingEditedExtremities[i] = this.lineSetCoorAdjusted[this.lineBeingEditedIndex][i];
        }

      } else if (this.lineSetCoorAdjusted[this.lineBeingEditedIndex][0] >= 0 && this.lineSetCoorAdjusted[this.lineBeingEditedIndex][1] >= 0) {
        this.lineBeingEditedExtremities[0] = this.lineSetCoorAdjusted[this.lineBeingEditedIndex][0];
        this.lineBeingEditedExtremities[1] = this.lineSetCoorAdjusted[this.lineBeingEditedIndex][1];
        this.lineSetCoorAdjusted = this.lineSetCoorAdjusted.filter(e => e !== this.lineSetCoorAdjusted[this.lineBeingEditedIndex]);
        this.lineSetToDisplayCoorAdjusted = this.lineSetToDisplayCoorAdjusted.filter(e => e !== this.lineSetToDisplayCoorAdjusted[this.lineBeingEditedIndex]);

      } else if (this.lineSetToDisplayCoorAdjusted[this.lineBeingEditedIndex][2] >= 0 && this.lineSetToDisplayCoorAdjusted[this.lineBeingEditedIndex][3] >= 0) {
        this.lineBeingEditedExtremities[0] = this.lineSetCoorAdjusted[this.lineBeingEditedIndex][2];
        this.lineBeingEditedExtremities[1] = this.lineSetCoorAdjusted[this.lineBeingEditedIndex][3];
        this.lineSetCoorAdjusted = this.lineSetCoorAdjusted.filter(e => e !== this.lineSetCoorAdjusted[this.lineBeingEditedIndex]);
        this.lineSetToDisplayCoorAdjusted = this.lineSetToDisplayCoorAdjusted.filter(e => e !== this.lineSetToDisplayCoorAdjusted[this.lineBeingEditedIndex]);

      } else {
        this.lineBeingEditedExtremities = [];
        this.lineSetCoorAdjusted = this.lineSetCoorAdjusted.filter(e => e !== this.lineSetCoorAdjusted[this.lineBeingEditedIndex]);
        this.lineSetToDisplayCoorAdjusted = this.lineSetToDisplayCoorAdjusted.filter(e => e !== this.lineSetToDisplayCoorAdjusted[this.lineBeingEditedIndex]);
      }
    }
  }

  public zoomWithCursor(event: any): void {
    event.preventDefault();
    this.zoom(event.deltaY > 0);
  }
  public zoomingProcessControl(processStart: boolean, zoomIn?: boolean) {
    this.zooming = processStart;
    if (processStart) this.zoom(zoomIn);
  } 
  private zoom(zoomIn: boolean): void {
    const zoomChange = zoomIn ? - 0.01 : 0.01;
    this.zoomInfo.percentage = Number((this.zoomInfo.percentage + zoomChange).toFixed(2));
    this.zoomInfo.display.x = this.dimContainerDimension.x / this.zoomInfo.percentage;
    this.zoomInfo.display.y = this.dimContainerDimension.y / this.zoomInfo.percentage;
    this.updateCanvasDisplayArea();

    if (this.zooming) setTimeout(() => {this.zoom(zoomIn);}, 50); 
  }
  public shiftingProcessControlWithCursor(processStart: boolean, event: any): void {
    this.shiftingWithCursor = processStart && event?.button === 2;

    if (this.shiftingWithCursor) {
      this.beforeShiftingCursorCoor = {
        x: event.clientX,
        y: event.clientY
      };

      this.beforeShiftingZoomInfoShift = {
        x: this.zoomInfo.shift.x,
        y: this.zoomInfo.shift.y
      };
    }
  }
  public shiftWithCursor(event: any): void {
    if (this.shiftingWithCursor) {
      this.zoomInfo.shift = {
        x: this.beforeShiftingZoomInfoShift.x - (event.clientX - this.beforeShiftingCursorCoor.x),
        y: this.beforeShiftingZoomInfoShift.y + (event.clientY - this.beforeShiftingCursorCoor.y)
      };
      this.updateCanvasDisplayArea();
    }
  }
  public shiftingProcessControl(processStart: boolean, direction?: Direction): void {
    this.shifting = processStart;
    if (processStart) this.shift(direction);
  }
  private shift(direction: Direction): void {
    switch (direction) {
      case "Up":
        this.zoomInfo.shift.y += 5;
        break;
      case "Down":
        this.zoomInfo.shift.y -= 5;
        break;
      case "Left":
        this.zoomInfo.shift.x -= 5;
        break;
      case "Right":
        this.zoomInfo.shift.x += 5;
        break;
    }
    this.updateCanvasDisplayArea();

    if (this.shifting) setTimeout(() => {this.shift(direction);}, 50); 
  }
  private updateCanvasDisplayArea(): void {
    this.applyZoomAndShiftConstraints();

    this.renderer.setStyle(this.backgroundImage.nativeElement, "top", `${this.zoomInfo.shift.y}px`);
    this.renderer.setStyle(this.backgroundImage.nativeElement, "left", `${-this.zoomInfo.shift.x}px`);
    this.renderer.setStyle(this.backgroundImage.nativeElement, "width", `${this.zoomInfo.display.x}px`);
    this.renderer.setStyle(this.backgroundImage.nativeElement, "height", `${this.zoomInfo.display.y}px`);

    this.renderer.setStyle(this.svgContainer.nativeElement, "top", `${this.zoomInfo.shift.y}px`);
    this.renderer.setStyle(this.svgContainer.nativeElement, "left", `${-this.zoomInfo.shift.x}px`);
    this.renderer.setStyle(this.svgContainer.nativeElement, "width", `${this.zoomInfo.display.x}px`);
    this.renderer.setStyle(this.svgContainer.nativeElement, "height", `${this.zoomInfo.display.y}px`);

    this.adjustLineCoordinates();
    this.extremitiesDisplayControl();
  }
  private applyZoomAndShiftConstraints(): void {
    if (this.zoomInfo.percentage > 1) this.zoomInfo.percentage = 1; {
      this.zoomInfo.display.x = this.dimContainerDimension.x / this.zoomInfo.percentage;
      this.zoomInfo.display.y = this.dimContainerDimension.y / this.zoomInfo.percentage;
    }

    if (this.zoomInfo.shift.x < 0) this.zoomInfo.shift.x = 0;
    if (this.zoomInfo.shift.x + this.dimContainerDimension.x > this.zoomInfo.display.x) {
      this.zoomInfo.shift.x = this.zoomInfo.display.x - this.dimContainerDimension.x;
      this.zoomInfo.shift.x = Math.floor(this.zoomInfo.shift.x);
    }
    if (this.zoomInfo.shift.y > 0) this.zoomInfo.shift.y = 0;
    if (- this.zoomInfo.shift.y + this.dimContainerDimension.y > this.zoomInfo.display.y) {
      this.zoomInfo.shift.y = - this.zoomInfo.display.y + this.dimContainerDimension.y;
      this.zoomInfo.shift.y = Math.ceil(this.zoomInfo.shift.y);
    }
  }

  public updateCurcorCoordinates(event: any): void {
    if (this.imgDimension.x > this.imgDimension.y) {
      this.cursorCoor = {
        x: event.offsetX * this.zoomInfo.percentage * this.imgDimension.x / this.containerDimension.x,
        y: event.offsetY * this.zoomInfo.percentage * this.imgDimension.x / this.containerDimension.x
      };
    } else {
      this.cursorCoor = {
        x: event.offsetX * this.zoomInfo.percentage * this.imgDimension.y / this.containerDimension.y,
        y: event.offsetY * this.zoomInfo.percentage * this.imgDimension.y / this.containerDimension.y
      };
    }

    this.cursorCoorEmitter.emit({
      showCursor: true,
      cursorCoor: {
        x: Number(this.cursorCoor.x.toFixed(0)),
        y: Number(this.cursorCoor.y.toFixed(0))
      }
    });
  }
  public hideCursorCoordinates(): void {
    this.cursorCoorEmitter.emit({ showCursor: false });
  }
  public moveLineProcessControl(processStart: boolean): void {
    if (this.process === "Add"
      && this.lineSet[this.lineBeingEditedIndex][0] >= 0
      && this.lineSet[this.lineBeingEditedIndex][1] >= 0
      && this.lineSet[this.lineBeingEditedIndex][2] >= 0
      && this.lineSet[this.lineBeingEditedIndex][3] >= 0) {
      if (processStart) {
        const selectedElement = this.elementSelection();
        if (selectedElement !== "None") {
          this.elementSelectionEmitter.emit(selectedElement);
        }
      } else {
        this.elementSelectionEmitter.emit("None");
        this.canvasCursor = "Default";
        this.lineCursor = "Move";
      }
    }
  }
  private elementSelection(): RoomSegEditSelection {
    const selectX = this.cursorCoor.x;
    const selectY = this.cursorCoor.y;

    const firstExtremX = this.lineSet[this.lineBeingEditedIndex][0];
    const firstExtremY = this.lineSet[this.lineBeingEditedIndex][1];
    const secondExtremX = this.lineSet[this.lineBeingEditedIndex][2];
    const secondExtremY = this.lineSet[this.lineBeingEditedIndex][3];

    // The equation of line is "y = (x-x1) * (y1-y2)/(x1-x2) + y1" ("x = (y-y1) * (x1-x2)/(y1-y2) + x1").
    const valueDifference = Math.abs(firstExtremX - secondExtremX) > Math.abs(firstExtremY - secondExtremY)
      // Assume the mouse down point to be on the line, use one of its coordinate value to calculate the other one.
      // Then compare it with the real value to see if the click point is approximately on the line.
      ? Math.abs(Math.abs(selectY) - Math.abs((selectX - firstExtremX) * (firstExtremY - secondExtremY) / (firstExtremX - secondExtremX) + firstExtremY)) // If the line is approximately horizontal.
      : Math.abs(Math.abs(selectX) - Math.abs((selectY - firstExtremY) * (firstExtremX - secondExtremX) / (firstExtremY - secondExtremY) + firstExtremX)); // If the line is approximately vertical.

    if (Math.abs(firstExtremX - selectX) <= 5 && Math.abs(firstExtremY - selectY) <= 5) {
      return "FirstExtrem";
    } else if (Math.abs(secondExtremX - selectX) <= 5 && Math.abs(secondExtremY - selectY) <= 5) {
      return "SecondExtrem";
    } else if (valueDifference <= 5) {
      return "Line"
    } else {
      return "None";
    }
  }
  public onCanvasClick(): void {
    this.canvasClickEmitter.emit();
  }
  public onLineMouseEvents(lineIndex?: number): void {
    this.lineCursorControl(lineIndex);
    this.extremitiesDisplayControl(lineIndex);
  }
  private lineCursorControl(lineIndex?: number): void {
    if (this.process === "Add") {
      if (this.lineSetToDisplay[this.lineBeingEditedIndex][0] >= 0 && this.lineSetToDisplay[this.lineBeingEditedIndex][1] >= 0
        && this.lineSetToDisplay[this.lineBeingEditedIndex][2] >= 0 && this.lineSetToDisplay[this.lineBeingEditedIndex][3] >= 0) {
        if (lineIndex === this.lineBeingEditedIndex) {
          this.lineCursor = "Move";
        } else {
          this.lineCursor = "Default";
        }
      }
    }
  }
  public extremitiesDisplayControl(lineIndex?: number): void {
    if (this.process !== "Add" && lineIndex !== undefined) {
      this.extremities = this.lineSetCoorAdjusted[lineIndex];
    } else {
      this.extremities = [];
    }
  }
  public onLineClick(lineIndex: number): void {
    switch (this.process) {
      case "Remove":
        this.lineIndexEmitter.emit(lineIndex);
        this.extremitiesDisplayControl();
        break;
      case "None":
        this.lineIndexEmitter.emit(lineIndex);
        break;
    }
  }
}
