export type Dimension = {
  x: number
  y: number
}

export type Coordinate = Dimension

export type DisplayElementsDimensions = {
  containerDimension: Dimension
  imgDimension: Dimension
}

export type DisplayZoomInfo = {
  percentage: number
  display: Dimension
  shift: Coordinate
}

export type Direction = "Up" | "Down" | "Left" | "Right"

export type RoomSegCursorCoorInfo = {
  showCursor: boolean
  cursorCoor?: Coordinate
}

export type RoomSegEditProcess = "None" | "Add" | "Remove" | "Edit"

export type RoomSegDisplayCursor = "Pointer" | "Default" | "Move"

export type RoomSegEditSelection =  "None" | "Line" | "FirstExtrem" | "SecondExtrem"

export type RoomSegMoveLineProcessInfo = {
  element: RoomSegEditSelection
  initialCursorCoor: Coordinate
}
