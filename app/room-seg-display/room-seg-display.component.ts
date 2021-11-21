import { Component, OnChanges, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { RoomSegEditProcess, DisplayElementsDimensions, RoomSegCursorCoorInfo, Dimension, RoomSegDisplayCursor, Coordinate, RoomSegEditSelection } from '../shared-ui.type';

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

  @ViewChild('backgroundImage') backgroundImage: ElementRef;
  @ViewChild('displayContainer') displayContainer: ElementRef;
  @ViewChild('displayDimensionContainer') displayDimensionContainer: ElementRef;
  @ViewChild('svgContainer') svgContainer: ElementRef;

  containerSideLength: number = 600;
  imgLoaded: boolean = false;
  imgDimension: Dimension;
  dimContainerDimension: Dimension;

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
      containerSideLength: this.containerSideLength,
      imgDimension: this.imgDimension
    });
  }
  private adjustContainers(): void {
    this.renderer.setStyle(this.displayContainer.nativeElement, "width", String(this.containerSideLength) + "px");
    this.renderer.setStyle(this.displayContainer.nativeElement, "height", String(this.containerSideLength) + "px");

    let dimContainerX, dimContainerY;
    if (this.imgDimension.x > this.imgDimension.y) {
      dimContainerX = this.containerSideLength;
      dimContainerY = this.containerSideLength * this.imgDimension.y / this.imgDimension.x;
    } else {
      dimContainerX = this.containerSideLength * this.imgDimension.x / this.imgDimension.y;
      dimContainerY = this.containerSideLength;
    }

    this.dimContainerDimension = { x: dimContainerX, y: dimContainerY };

    // 10px from room-seg-display-container's margin
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "top", String((this.containerSideLength - dimContainerY) / 2 + 10) + "px");
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "left", String((this.containerSideLength - dimContainerX) / 2 + 10) + "px");
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "width", String(dimContainerX) + "px");
    this.renderer.setStyle(this.displayDimensionContainer.nativeElement, "height", String(dimContainerY) + "px");

    this.renderer.setStyle(this.svgContainer.nativeElement, "width", String(dimContainerX) + "px");
    this.renderer.setStyle(this.svgContainer.nativeElement, "height", String(dimContainerY) + "px");
  }
  private adjustLineCoordinates(): void {
    this.lineSetCoorAdjusted = JSON.parse(JSON.stringify(this.lineSet));
    this.lineSetToDisplayCoorAdjusted = JSON.parse(JSON.stringify(this.lineSetToDisplay));

    for (let i = 0; i < this.lineSet.length; i++) {
      this.lineSetCoorAdjusted[i][0] = (this.lineSet[i][0] / this.imgDimension.x) * this.dimContainerDimension.x;
      this.lineSetCoorAdjusted[i][1] = (this.lineSet[i][1] / this.imgDimension.y) * this.dimContainerDimension.y;
      this.lineSetCoorAdjusted[i][2] = (this.lineSet[i][2] / this.imgDimension.x) * this.dimContainerDimension.x;
      this.lineSetCoorAdjusted[i][3] = (this.lineSet[i][3] / this.imgDimension.y) * this.dimContainerDimension.y;

      this.lineSetToDisplayCoorAdjusted[i][0] = (this.lineSetToDisplay[i][0] / this.imgDimension.x) * this.dimContainerDimension.x;
      this.lineSetToDisplayCoorAdjusted[i][1] = (this.lineSetToDisplay[i][1] / this.imgDimension.y) * this.dimContainerDimension.y;
      this.lineSetToDisplayCoorAdjusted[i][2] = (this.lineSetToDisplay[i][2] / this.imgDimension.x) * this.dimContainerDimension.x;
      this.lineSetToDisplayCoorAdjusted[i][3] = (this.lineSetToDisplay[i][3] / this.imgDimension.y) * this.dimContainerDimension.y;
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

  public onCanvasCursorMove(event: any): void {
    if (this.imgDimension.x > this.imgDimension.y) {
      this.cursorCoor = {
        x: event.offsetX * this.imgDimension.x / this.containerSideLength,
        y: event.offsetY * this.imgDimension.x / this.containerSideLength
      }
    } else {
      this.cursorCoor = {
        x: event.offsetX * this.imgDimension.y / this.containerSideLength,
        y: event.offsetY * this.imgDimension.y / this.containerSideLength
      }
    }

    this.updateCurcorCoordinates();
  }
  private updateCurcorCoordinates(): void {
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
  public onLineMouseEvent(lineIndex?: number): void {
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
