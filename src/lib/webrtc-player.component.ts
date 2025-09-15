import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from "@angular/core";

// Import the WebRTC Reader class
import { PromiseQWebRTCReader } from "./promiseq-webrtc-types";

@Component({
    selector: "webrtc-player",
    templateUrl: "./webrtc-player.component.html",
    styleUrls: ["./webrtc-player.component.css"],
})
export class WebrtcPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() streamUrl: string = "";
    @Input() autoPlay: boolean = true;
    @Input() muted: boolean = false;
    @Input() authToken: string = "";

    // Custom Styling
    @Input() containerClass: string = "";
    @Input() loaderClass: string = "";
    @Input() videoClass: string = "";
    @Input() errorClass: string = "";

    // Events
    @Output() onReady = new EventEmitter<any>();
    @Output() onError = new EventEmitter<string>();
    @Output() onTrack = new EventEmitter<any>();
    @Output() playStateChanged = new EventEmitter<boolean>();

    @ViewChild("videoElement", { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

    public isLoading: boolean = false;
    public errorMessage: string = "";
    public isPlaying: boolean = false;
    public isConnected: boolean = false;

    private webrtcReader: PromiseQWebRTCReader | null = null;
    private currentStream: MediaStream | null = null;
    private timeInterval: any;

    constructor() {}

    ngOnInit(): void {
        // Start time update interval
        this.timeInterval = setInterval(() => {
            // This will trigger change detection for the timestamp
        }, 1000);
    }

    ngAfterViewInit(): void {
        if (this.streamUrl && this.autoPlay) {
            this.startStream();
        }
    }

    ngOnDestroy(): void {
        this.cleanup();
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }

    public startStream(): void {
        if (!this.streamUrl) {
            this.handleError("No stream URL provided");
            return;
        }

        this.cleanup();
        this.isLoading = true;
        this.errorMessage = "";
        this.isConnected = false;

        try {
            this.webrtcReader = new PromiseQWebRTCReader({
                url: this.streamUrl,
                authToken: this.authToken,
                onTrack: (evt: RTCTrackEvent) => {
                    console.log("Track received:", evt.track.kind);
                    this.handleTrack(evt);
                    this.onTrack.emit(evt);
                },
                onReady: (data: any) => {
                    console.log("Stream ready:", data);
                    this.handleStreamReady(data);
                    this.onReady.emit(data);
                },
                onError: (error: string) => {
                    console.error("WebRTC error:", error);
                    this.handleError(error);
                },
            });
        } catch (error) {
            console.error("Error starting stream:", error);
            this.handleError("Failed to start stream");
        }
    }

    public stopStream(): void {
        this.cleanup();
        this.isPlaying = false;
        this.isConnected = false;
        this.playStateChanged.emit(false);
    }

    public play(): void {
        if (this.videoElement && this.videoElement.nativeElement) {
            this.videoElement.nativeElement
                .play()
                .then(() => {
                    this.isPlaying = true;
                    this.playStateChanged.emit(true);
                })
                .catch((error) => {
                    console.error("Error playing video:", error);
                    this.handleError("Failed to play video");
                });
        } else if (!this.isConnected && this.streamUrl) {
            this.startStream();
        }
    }

    public pause(): void {
        if (this.videoElement && this.videoElement.nativeElement) {
            this.videoElement.nativeElement.pause();
            this.isPlaying = false;
            this.playStateChanged.emit(false);
        }
    }

    public togglePlayPause(): void {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    private handleTrack(evt: RTCTrackEvent): void {
        if (evt.streams && evt.streams.length > 0) {
            this.currentStream = evt.streams[0];
            if (this.videoElement && this.videoElement.nativeElement) {
                this.videoElement.nativeElement.srcObject = this.currentStream;
            }
        }
    }

    private handleStreamReady(data: any): void {
        this.isLoading = false;
        this.isConnected = true;

        if (data.streams && data.streams.length > 0) {
            this.currentStream = data.streams[0];
            if (this.videoElement && this.videoElement.nativeElement) {
                this.videoElement.nativeElement.srcObject = this.currentStream;

                if (this.autoPlay) {
                    this.play();
                }
            }
        }
    }

    private handleError(error: string): void {
        this.isLoading = false;
        this.errorMessage = error;
        this.isConnected = false;
        this.isPlaying = false;
        this.onError.emit(error);
        this.playStateChanged.emit(false);
    }

    private cleanup(): void {
        if (this.webrtcReader) {
            this.webrtcReader.cleanup();
            this.webrtcReader = null;
        }

        if (this.videoElement && this.videoElement.nativeElement) {
            this.videoElement.nativeElement.srcObject = null;
        }

        if (this.currentStream) {
            this.currentStream.getTracks().forEach((track) => track.stop());
            this.currentStream = null;
        }

        this.isLoading = false;
        this.errorMessage = "";
    }

    onVideoLoadedMetadata(): void {
        console.log("Video metadata loaded");
    }

    onVideoPlay(): void {
        this.isPlaying = true;
        this.playStateChanged.emit(true);
    }

    onVideoPause(): void {
        this.isPlaying = false;
        this.playStateChanged.emit(false);
    }

    onVideoError(event: any): void {
        console.error("Video error:", event);
        this.handleError("Video playback error");
    }

    getCurrentTime(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}
