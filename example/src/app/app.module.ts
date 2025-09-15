import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { WebrtcPlayerModule } from "@promiseq/angular-webrtc-player";

import { AppComponent } from "./app.component";

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, FormsModule, WebrtcPlayerModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
