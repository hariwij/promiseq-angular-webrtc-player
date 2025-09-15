// Import types from the declaration file
export interface PromiseQWebRTCReaderConfig {
    url: string;
    authToken?: string;
    onTrack?: (evt: RTCTrackEvent) => void;
    onReady?: (data: any) => void;
    onError?: (error: string) => void;
}

export class PromiseQWebRTCReader {
    constructor(config: PromiseQWebRTCReaderConfig) {
        // This will be implemented by the actual JavaScript class
        console.warn("PromiseQWebRTCReader implementation should be loaded from external JS");
    }

    cleanup(): void {
        // This will be implemented by the actual JavaScript class
    }
}
