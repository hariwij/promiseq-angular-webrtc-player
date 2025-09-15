# promiseQ Angular WebRTC Player

Angular WebRTC Player for promiseQ

## Installation

```bash
npm install @promiseq/angular-webrtc-player
```

## Usage

### 1. Import the Module

```typescript
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { WebrtcPlayerModule } from "@promiseq/angular-webrtc-player";

import { AppComponent } from "./app.component";

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, WebrtcPlayerModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
```

### 2. Use the Component

```html
<webrtc-player [streamUrl]="'ws://localhost:8889/stream/live/whep'" [autoPlay]="true" [muted]="false" [authToken]="'your-auth-token'" [containerClass]="'custom-container'" [videoClass]="'custom-video'" [loaderClass]="'custom-loader'" [errorClass]="'custom-error'" (onReady)="onStreamReady($event)" (onError)="onStreamError($event)" (onTrack)="onStreamTrack($event)" (playStateChanged)="onPlayStateChanged($event)"> </webrtc-player>
```

### 3. Component Events

```typescript
export class AppComponent {
    onStreamReady(data: any) {
        console.log("Stream is ready:", data);
    }

    onStreamError(error: string) {
        console.error("Stream error:", error);
    }

    onStreamTrack(track: any) {
        console.log("Track received:", track);
    }

    onPlayStateChanged(isPlaying: boolean) {
        console.log("Play state changed:", isPlaying);
    }
}
```

## API Reference

### Input Properties

| Property         | Type      | Default | Description                                |
| ---------------- | --------- | ------- | ------------------------------------------ |
| `streamUrl`      | `string`  | `""`    | WebRTC stream URL (WHEP endpoint)          |
| `autoPlay`       | `boolean` | `true`  | Auto-start the stream when component loads |
| `muted`          | `boolean` | `false` | Mute the video audio                       |
| `authToken`      | `string`  | `""`    | Authentication token for the stream        |
| `containerClass` | `string`  | `""`    | Custom CSS class for the container         |
| `videoClass`     | `string`  | `""`    | Custom CSS class for the video element     |
| `loaderClass`    | `string`  | `""`    | Custom CSS class for the loading overlay   |
| `errorClass`     | `string`  | `""`    | Custom CSS class for the error overlay     |

### Output Events

| Event              | Type                    | Description                         |
| ------------------ | ----------------------- | ----------------------------------- |
| `onReady`          | `EventEmitter<any>`     | Fired when the stream is ready      |
| `onError`          | `EventEmitter<string>`  | Fired when an error occurs          |
| `onTrack`          | `EventEmitter<any>`     | Fired when a new track is received  |
| `playStateChanged` | `EventEmitter<boolean>` | Fired when play/pause state changes |

### Public Methods

| Method              | Description                   |
| ------------------- | ----------------------------- |
| `startStream()`     | Start the WebRTC stream       |
| `stopStream()`      | Stop the WebRTC stream        |
| `play()`            | Play the video                |
| `pause()`           | Pause the video               |
| `togglePlayPause()` | Toggle between play and pause |

### Component State Properties

| Property       | Type      | Description                              |
| -------------- | --------- | ---------------------------------------- |
| `isLoading`    | `boolean` | Whether the stream is loading            |
| `isPlaying`    | `boolean` | Whether the video is playing             |
| `isConnected`  | `boolean` | Whether WebRTC connection is established |
| `errorMessage` | `string`  | Current error message if any             |

## Styling

The component comes with default styling, but you can customize it using CSS classes:

```css
/* Custom container styling */
.custom-container {
    border: 2px solid #007bff;
    border-radius: 8px;
}

/* Custom video styling */
.custom-video {
    filter: brightness(1.1);
}

/* Custom loader styling */
.custom-loader {
    background-color: rgba(0, 0, 0, 0.8);
}

/* Custom error styling */
.custom-error {
    background-color: rgba(255, 0, 0, 0.1);
}
```

## Requirements

-   Angular 17+
-   Modern browser with WebRTC support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues, please file them on the [GitHub Issues](https://github.com/hariwij/promiseq-angular-webrtc-player/issues) page.
