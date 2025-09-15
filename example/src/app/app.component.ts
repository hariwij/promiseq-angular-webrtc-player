import { Component, ViewChild } from "@angular/core";
import { WebrtcPlayerComponent } from "promiseq-angular-webrtc-player";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"],
})
export class AppComponent {
    @ViewChild("webrtcPlayer") webrtcPlayer!: WebrtcPlayerComponent;

    // URL Input
    inputUrl: string = "";
    validatedUrl: string = "";
    isValidUrl: boolean = false;

    // WebRTC Player Configuration
    playerConfig = {
        name: "WebRTC Stream",
        isRecording: false,
        showToolBar: true,
        autoPlay: true,
        muted: false,
        controls: true,
        authToken: "",
    };

    // Player State
    isPlayerPlaying: boolean = false;

    validateAndLoadUrl(): void {
        if (this.isValidUrlFormat(this.inputUrl)) {
            this.validatedUrl = this.inputUrl;
            this.isValidUrl = true;
        } else {
            this.isValidUrl = false;
            this.validatedUrl = "";
            alert("Please enter a valid URL");
        }
    }

    private isValidUrlFormat(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    // External Player Controls
    playStream(): void {
        if (this.webrtcPlayer) {
            this.webrtcPlayer.play();
        }
    }

    pauseStream(): void {
        if (this.webrtcPlayer) {
            this.webrtcPlayer.pause();
        }
    }

    togglePlayPause(): void {
        if (this.webrtcPlayer) {
            this.webrtcPlayer.togglePlayPause();
        }
    }

    stopStream(): void {
        if (this.webrtcPlayer) {
            this.webrtcPlayer.stopStream();
        }
    }

    restartStream(): void {
        if (this.webrtcPlayer) {
            this.webrtcPlayer.startStream();
        }
    }

    // Event Handlers
    onPlayerReady(data: any): void {
        console.log("Player ready:", data);
    }

    onPlayerError(error: string): void {
        console.error("Player error:", error);
    }

    onPlayerTrack(event: any): void {
        console.log("Player track:", event);
    }

    onPlayStateChanged(isPlaying: boolean): void {
        this.isPlayerPlaying = isPlaying;
        console.log("Play state changed:", isPlaying);
    }
}
