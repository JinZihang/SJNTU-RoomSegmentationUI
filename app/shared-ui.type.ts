export type FileUploadResult = {
  fileName: string
  s3Bucket: string
  s3Key: string
  eTag: string
  contentSize: number
  contentType: string
  uploadType: number
  uploadStartAt: Date
  uploadEndAt: Date
  uploadSuccess: boolean
  uploadFailReason: any
}

export type BaseEntity = {
  id: number
  createdOn: Date
  updatedOn: Date
  isHidden: boolean
}

export type ProjectFile = BaseEntity & {
  scanIterationId: number
  bimBotSessionId: number
  aiProcessTaskId: number
  auditPass: boolean
  remarks: string
  type: number
  contentSize: number
  contentType: string
  s3Bucket: string
  s3Key: string
  s3ETag: string
}

export type KeyValueSettings = BaseEntity & {
  key: string
  value: string
}

export type Dimension = {
  x: number
  y: number
}

export type Coordinate = Dimension

export type DisplayElementsDimensions = {
  containerSideLength: number
  imgDimension: Dimension
}

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
