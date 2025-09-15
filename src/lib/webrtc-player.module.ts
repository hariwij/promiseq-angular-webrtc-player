import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WebrtcPlayerComponent } from "./webrtc-player.component";

@NgModule({
    declarations: [WebrtcPlayerComponent],
    imports: [CommonModule],
    exports: [WebrtcPlayerComponent],
})
export class WebrtcPlayerModule {}
