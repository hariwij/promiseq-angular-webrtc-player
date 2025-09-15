# Angular WebRTC Player - Example App

This example application demonstrates how to use the `promiseq-angular-webrtc-player` npm package in a real Angular application.

## Setup Instructions

### 1. Install Dependencies

First, make sure you have the promiseq-angular-webrtc-player package built and available:

```bash
# Navigate to the package root and build it
cd ..
npm install
npm run build

# Navigate to the example folder
cd example
npm install
```

### 2. Link the Local Package (For Development)

Since this example uses the local package during development, you need to link it:

```bash
# From the package root directory
cd ..
npm pack ./dist
npm install ./promiseq-angular-webrtc-player-1.0.0.tgz

# Or create a symlink for development
cd example
npm link ../dist
```

### 3. Run the Example

```bash
npm start
```

The application will start on `http://localhost:4200`

## Features Demonstrated

This example app shows how to:

1. **Import and use the WebRTC Player module**

    - Import `WebrtcPlayerModule` in your app module
    - Use the `<webrtc-player>` component in templates

2. **Handle component events**

    - `onReady` - When stream is ready
    - `onError` - When errors occur
    - `onTrack` - When tracks are received
    - `playStateChanged` - When play/pause state changes

3. **Control the player programmatically**

    - Start/stop streams
    - Play/pause video
    - Access player state

4. **Configure player options**
    - Stream URL
    - Auto-play settings
    - Mute options
    - Authentication tokens
    - Custom CSS classes

## Usage Example

```typescript
import { Component, ViewChild } from "@angular/core";
import { WebrtcPlayerComponent } from "promiseq-angular-webrtc-player";

@Component({
    selector: "app-root",
    template: ` <webrtc-player #player [streamUrl]="streamUrl" [autoPlay]="true" (onReady)="onStreamReady($event)" (onError)="onStreamError($event)"> </webrtc-player> `,
})
export class AppComponent {
    @ViewChild("player") player!: WebrtcPlayerComponent;
    streamUrl = "ws://localhost:8889/stream/live/whep";

    onStreamReady(data: any) {
        console.log("Stream ready:", data);
    }

    onStreamError(error: string) {
        console.error("Stream error:", error);
    }
}
```

## Building for Production

```bash
npm run build
```

The built application will be in the `dist/` folder.

## Troubleshooting

### Module not found errors

-   Make sure the promiseq-angular-webrtc-player package is built and installed
-   Check that the package is properly linked if using local development

### WebRTC connection issues

-   Ensure you have a valid WebRTC stream URL
-   Ensure you have internet connectivity
-   Ensure you are not behind a restrictive firewall or VPN
-   Check browser console for detailed error messages
-   Verify the stream URL format and accessibility
