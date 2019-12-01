type LogErrorF = (error: string) => void;

let logErrorF: LogErrorF | undefined;

export function setLogError(value: LogErrorF) {
    logErrorF = value;
}

export function logError(text: string) {
    if (logErrorF) {
        logErrorF(text);
    }
}