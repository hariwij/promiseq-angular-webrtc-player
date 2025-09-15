declare module "*.js" {
    const content: any;
    export default content;
}

export interface PromiseQWebRTCReaderConfig {
    url: string;
    authToken?: string;
    onTrack?: (evt: RTCTrackEvent) => void;
    onReady?: (data: any) => void;
    onError?: (error: string) => void;
}

export declare class PromiseQWebRTCReader {
    constructor(config: PromiseQWebRTCReaderConfig);
    cleanup(): void;
}
