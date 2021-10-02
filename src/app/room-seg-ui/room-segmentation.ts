export interface LineSetEditHistory {
    editIndex: number;
    editName: string;
}

export interface ProcessInfo {
    action: string,
    lineIndex?: number
}

export interface LineAddProcessInfo {
    isLineToBeAddedComplete: boolean,
    isTriggeredByLineEditProcess: boolean,
    lineToBeAdded: number[]
}