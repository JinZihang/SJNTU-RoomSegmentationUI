export interface Line {
    lineIndex: number;
    firstExtremX: number;
    firstExtremY: number;
    secondExtremX: number;
    secondExtremY: number;
}

export interface ProcessInfo {
    action: string;
    lineIndex?: number;
}

export interface LineAddProcessInfo {
    isLineToBeAddedComplete: boolean;
    isTriggeredByLineEditProcess: boolean;
    lineToBeAdded: number[];
}

export interface LineSetEditHistory {
    editIndex: number;
    editName: string;
}