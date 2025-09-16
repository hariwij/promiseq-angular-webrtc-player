import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone } from "@angular/core";
import { PromiseQWebRTCReader } from "./promiseq-webrtc";

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

    constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

    ngOnInit(): void {
        // Start time update interval
        this.timeInterval = setInterval(() => {
            // This will trigger change detection for the timestamp
        }, 1000);
    }

    ngAfterViewInit(): void {
        if (this.streamUrl && this.autoPlay) {
            // Use setTimeout to defer the startStream call to the next tick
            setTimeout(() => {
                this.startStream();
            }, 0);
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

        // Use setTimeout to ensure state changes happen in the next tick
        setTimeout(() => {
            this.isLoading = true;
            this.errorMessage = "";
            this.isConnected = false;
            this.cdr.detectChanges(); // Manually trigger change detection

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
        }, 0);
    }

    public stopStream(): void {
        this.cleanup();
        this.ngZone.run(() => {
            this.isPlaying = false;
            this.isConnected = false;
            this.playStateChanged.emit(false);
        });
    }

    public play(): void {
        if (this.videoElement && this.videoElement.nativeElement) {
            this.videoElement.nativeElement
                .play()
                .then(() => {
                    this.ngZone.run(() => {
                        this.isPlaying = true;
                        this.playStateChanged.emit(true);
                    });
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
            this.ngZone.run(() => {
                this.isPlaying = false;
                this.playStateChanged.emit(false);
            });
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
        this.ngZone.run(() => {
            if (evt.streams && evt.streams.length > 0) {
                this.currentStream = evt.streams[0];
                if (this.videoElement && this.videoElement.nativeElement) {
                    this.videoElement.nativeElement.srcObject = this.currentStream;
                }
            }
        });
    }

    private handleStreamReady(data: any): void {
        this.ngZone.run(() => {
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

            // Manually trigger change detection to ensure UI updates
            this.cdr.detectChanges();
        });
    }

    private handleError(error: string): void {
        this.ngZone.run(() => {
            this.isLoading = false;
            this.errorMessage = error;
            this.isConnected = false;
            this.isPlaying = false;
            this.onError.emit(error);
            this.playStateChanged.emit(false);

            // Manually trigger change detection
            this.cdr.detectChanges();
        });
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
        this.ngZone.run(() => {
            this.isPlaying = true;
            this.playStateChanged.emit(true);
        });
    }

    onVideoPause(): void {
        this.ngZone.run(() => {
            this.isPlaying = false;
            this.playStateChanged.emit(false);
        });
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
