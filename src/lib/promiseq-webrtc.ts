const debug = false;

const log = (...args: any[]): void => {
    if (debug) {
        console.log(...args);
    }
};

const supportsNonAdvertisedCodec = (codec: string, fmtp?: string): Promise<boolean> =>
    new Promise((resolve) => {
        const payloadType = 118; // TODO: dynamic
        const pc = new RTCPeerConnection({ iceServers: [] });
        const mediaType = "audio";
        pc.addTransceiver(mediaType, { direction: "recvonly" });
        pc.createOffer()
            .then((offer) => {
                if (offer.sdp!.includes(" " + codec)) {
                    // codec is advertised, there's no need to add it manually
                    throw new Error("already present");
                }
                const sections = offer.sdp!.split(`m=${mediaType}`);
                const lines = sections[1].split("\r\n");
                lines[0] += ` ${payloadType}`;
                lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} ${codec}`);
                if (fmtp !== undefined) {
                    lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} ${fmtp}`);
                }
                sections[1] = lines.join("\r\n");
                offer.sdp = sections.join(`m=${mediaType}`);
                return pc.setLocalDescription(offer);
            })
            .then(() => {
                return pc.setRemoteDescription(
                    new RTCSessionDescription({
                        type: "answer",
                        sdp: "v=0\r\n" + "o=- 6539324223450680508 0 IN IP4 0.0.0.0\r\n" + "s=-\r\n" + "t=0 0\r\n" + "a=fingerprint:sha-256 0D:9F:78:15:42:B5:4B:E6:E2:94:3E:5B:37:78:E1:4B:54:59:A3:36:3A:E5:05:EB:27:EE:8F:D2:2D:41:29:25\r\n" + `m=${mediaType} 9 UDP/TLS/RTP/SAVPF ${payloadType}` + "\r\n" + "c=IN IP4 0.0.0.0\r\n" + "a=ice-pwd:7c3bf4770007e7432ee4ea4d697db675\r\n" + "a=ice-ufrag:29e036dc\r\n" + "a=sendonly\r\n" + "a=rtcp-mux\r\n" + `a=rtpmap:${payloadType} ${codec}` + "\r\n" + (fmtp !== undefined ? `a=fmtp:${payloadType} ${fmtp}` + "\r\n" : ""),
                    }),
                );
            })
            .then(() => {
                resolve(true);
            })
            .catch(() => {
                resolve(false);
            })
            .finally(() => {
                pc.close();
            });
    });

const unquoteCredential = (v: string): string => JSON.parse(`"${v}"`);

interface IceServer {
    urls: string[];
    username?: string;
    credential?: string;
    credentialType?: string;
}

const linkToIceServers = (links: string | null): IceServer[] =>
    links !== null
        ? links.split(", ").map((link) => {
              const m = link.match(/^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i);
              const ret: IceServer = {
                  urls: [m![1]],
              };

              if (m![3] !== undefined) {
                  ret.username = unquoteCredential(m![3]);
                  ret.credential = unquoteCredential(m![4]);
                  ret.credentialType = "password";
              }

              return ret;
          })
        : [];

interface OfferData {
    iceUfrag: string;
    icePwd: string;
    medias: string[];
}

const parseOffer = (sdp: string): OfferData => {
    const ret: OfferData = {
        iceUfrag: "",
        icePwd: "",
        medias: [],
    };

    for (const line of sdp.split("\r\n")) {
        if (line.startsWith("m=")) {
            ret.medias.push(line.slice("m=".length));
        } else if (ret.iceUfrag === "" && line.startsWith("a=ice-ufrag:")) {
            ret.iceUfrag = line.slice("a=ice-ufrag:".length);
        } else if (ret.icePwd === "" && line.startsWith("a=ice-pwd:")) {
            ret.icePwd = line.slice("a=ice-pwd:".length);
        }
    }

    return ret;
};

const findFreePayloadType = (firstLine: string): string => {
    const payloadTypes = firstLine.split(" ").slice(3);
    for (let i = 96; i <= 127; i++) {
        if (!payloadTypes.includes(i.toString())) {
            return i.toString();
        }
    }
    throw Error("unable to find a free payload type");
};

const enableStereoPcmau = (section: string): string => {
    let lines = section.split("\r\n");

    let payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} PCMU/8000/2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} PCMA/8000/2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    return lines.join("\r\n");
};

const enableMultichannelOpus = (section: string): string => {
    let lines = section.split("\r\n");

    let payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} multiopus/48000/3`);
    lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} channel_mapping=0,2,1;num_streams=2;coupled_streams=1`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} multiopus/48000/4`);
    lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} channel_mapping=0,1,2,3;num_streams=2;coupled_streams=2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} multiopus/48000/5`);
    lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} channel_mapping=0,4,1,2,3;num_streams=3;coupled_streams=2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} multiopus/48000/6`);
    lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} channel_mapping=0,4,1,2,3,5;num_streams=4;coupled_streams=2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} multiopus/48000/7`);
    lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} channel_mapping=0,4,1,2,3,5,6;num_streams=4;coupled_streams=4`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} multiopus/48000/8`);
    lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} channel_mapping=0,6,1,4,5,2,3,7;num_streams=5;coupled_streams=4`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    return lines.join("\r\n");
};

const enableL16 = (section: string): string => {
    let lines = section.split("\r\n");

    let payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} L16/8000/2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} L16/16000/2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = findFreePayloadType(lines[0]);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} L16/48000/2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    return lines.join("\r\n");
};

const enableStereoOpus = (section: string): string => {
    let opusPayloadFormat = "";
    let lines = section.split("\r\n");

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("a=rtpmap:") && lines[i].toLowerCase().includes("opus/")) {
            opusPayloadFormat = lines[i].slice("a=rtpmap:".length).split(" ")[0];
            break;
        }
    }

    if (opusPayloadFormat === "") {
        return section;
    }

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("a=fmtp:" + opusPayloadFormat + " ")) {
            if (!lines[i].includes("stereo")) {
                lines[i] += ";stereo=1";
            }
            if (!lines[i].includes("sprop-stereo")) {
                lines[i] += ";sprop-stereo=1";
            }
        }
    }

    return lines.join("\r\n");
};

const editOffer = (sdp: string, nonAdvertisedCodecs: string[]): string => {
    const sections = sdp.split("m=");

    for (let i = 0; i < sections.length; i++) {
        if (sections[i].startsWith("audio")) {
            sections[i] = enableStereoOpus(sections[i]);

            if (nonAdvertisedCodecs.includes("pcma/8000/2")) {
                sections[i] = enableStereoPcmau(sections[i]);
            }
            if (nonAdvertisedCodecs.includes("multiopus/48000/6")) {
                sections[i] = enableMultichannelOpus(sections[i]);
            }
            if (nonAdvertisedCodecs.includes("L16/48000/2")) {
                sections[i] = enableL16(sections[i]);
            }

            break;
        }
    }

    return sections.join("m=");
};

const generateSdpFragment = (od: OfferData, candidates: RTCIceCandidate[]): string => {
    const candidatesByMedia: { [key: number]: RTCIceCandidate[] } = {};
    for (const candidate of candidates) {
        const mid = candidate.sdpMLineIndex!;
        if (candidatesByMedia[mid] === undefined) {
            candidatesByMedia[mid] = [];
        }
        candidatesByMedia[mid].push(candidate);
    }

    let frag = "a=ice-ufrag:" + od.iceUfrag + "\r\n" + "a=ice-pwd:" + od.icePwd + "\r\n";

    let mid = 0;

    for (const media of od.medias) {
        if (candidatesByMedia[mid] !== undefined) {
            frag += "m=" + media + "\r\n" + "a=mid:" + mid + "\r\n";

            for (const candidate of candidatesByMedia[mid]) {
                frag += "a=" + candidate.candidate + "\r\n";
            }
        }
        mid++;
    }

    return frag;
};

const retryPause = 2000;

type ReaderState = "initializing" | "running" | "restarting" | "error" | "closed";

interface OnReadyData {
    streams: MediaStream[] | null;
    trackCount: number;
}

interface PromiseQWebRTCReaderConfig {
    url: string;
    authToken?: string;
    onTrack?: (event: RTCTrackEvent) => void;
    onError?: (error: string) => void;
    onReady?: (data: OnReadyData) => void;
}

export class PromiseQWebRTCReader {
    private conf: PromiseQWebRTCReaderConfig;
    private state: ReaderState;
    private restartTimeout: number | null;
    private pc: RTCPeerConnection | null;
    private offerData: OfferData | null;
    private sessionUrl: string | null;
    private queuedCandidates: RTCIceCandidate[];
    private streamReady: boolean;
    private trackCount: number;
    private nonAdvertisedCodecs: string[];
    private jwtToken: string | null;
    private cleanUrl: string;

    constructor(conf: PromiseQWebRTCReaderConfig) {
        this.conf = conf;
        this.state = "initializing";
        this.restartTimeout = null;
        this.pc = null;
        this.offerData = null;
        this.sessionUrl = null;
        this.queuedCandidates = [];
        this.streamReady = false;
        this.trackCount = 0;
        this.nonAdvertisedCodecs = [];
        this.jwtToken = null;
        this.cleanUrl = "";

        // Extract JWT from URL and prepare clean URL and auth headers
        this.processJwtAuth();

        log("PromiseQWebRTCReader constructor called with config:", {
            url: this.cleanUrl,
            hasJwt: !!this.jwtToken,
            hasOnTrack: !!this.conf.onTrack,
            hasOnError: !!this.conf.onError,
            hasOnReady: !!this.conf.onReady,
        });

        this.getNonAdvertisedCodecs()
            .then(() => this.start())
            .catch((err) => {
                this.handleError(err);
            });
    }

    private processJwtAuth = (): void => {
        const url = new URL(this.conf.url);
        const jwt = this.conf.authToken || url.searchParams.get("jwt");

        url.searchParams.delete("jwt");

        if (jwt) {
            this.jwtToken = jwt;
            // Remove JWT from URL
            this.cleanUrl = url.toString();
        } else {
            this.jwtToken = null;
            this.cleanUrl = this.conf.url;
        }
    };

    private getAuthHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (this.jwtToken) {
            headers["Authorization"] = `Bearer ${this.jwtToken}`;
        }
        return headers;
    };

    private handleError = (err: any): void => {
        if (this.state === "restarting" || this.state === "error") {
            return;
        }

        if (this.pc !== null) {
            this.pc.close();
            this.pc = null;
        }

        this.offerData = null;
        this.queuedCandidates = [];
        this.streamReady = false;
        this.trackCount = 0;

        if (this.state === "running") {
            this.state = "restarting";

            this.restartTimeout = window.setTimeout(() => {
                this.restartTimeout = null;
                this.start();
            }, retryPause);

            if (this.conf.onError !== undefined) {
                this.conf.onError(err + ", retrying in some seconds");
            }
        } else {
            this.state = "error";

            if (this.conf.onError !== undefined) {
                this.conf.onError(err);
            }
        }
    };

    private getNonAdvertisedCodecs = (): Promise<void> => {
        return Promise.all([["pcma/8000/2"], ["multiopus/48000/6", "channel_mapping=0,4,1,2,3,5;num_streams=4;coupled_streams=2"], ["L16/48000/2"]].map((c) => supportsNonAdvertisedCodec(c[0], c[1]).then((r) => (r ? c[0] : false))))
            .then((c) => c.filter((e): e is string => e !== false))
            .then((codecs) => {
                this.nonAdvertisedCodecs = codecs;
            });
    };

    private start = (): void => {
        this.state = "running";
        this.streamReady = false;
        this.trackCount = 0;

        this.requestICEServers()
            .then((iceServers) => this.setupPeerConnection(iceServers))
            .then((offer) => this.sendOffer(offer))
            .then((answer) => this.setAnswer(answer))
            .catch((err) => {
                this.handleError(err.toString());
            });
    };

    private requestICEServers = (): Promise<IceServer[]> => {
        return fetch(this.cleanUrl, {
            method: "OPTIONS",
            headers: this.getAuthHeaders(),
        }).then((res) => linkToIceServers(res.headers.get("Link")));
    };

    private setupPeerConnection = (iceServers: IceServer[]): Promise<string> => {
        log("Setting up peer connection with ICE servers:", iceServers);

        this.pc = new RTCPeerConnection({
            iceServers,
            sdpSemantics: "unified-plan",
        } as RTCConfiguration);

        const direction: RTCRtpTransceiverDirection = "recvonly";
        this.pc.addTransceiver("video", { direction });
        this.pc.addTransceiver("audio", { direction });

        this.pc.onicecandidate = (evt) => this.onLocalCandidate(evt);
        this.pc.onconnectionstatechange = () => {
            log("Connection state changed to:", this.pc!.connectionState);
            this.onConnectionState();
            this.checkReadyState();
        };
        this.pc.ontrack = (evt) => {
            log("Track received:", evt.track.kind);
            this.onTrack(evt);
        };

        return this.pc.createOffer().then((offer) => {
            offer.sdp = editOffer(offer.sdp!, this.nonAdvertisedCodecs);
            this.offerData = parseOffer(offer.sdp!);

            return this.pc!.setLocalDescription(offer).then(() => offer.sdp!);
        });
    };

    // Add a separate method to check ready state
    private checkReadyState = (): void => {
        log("Checking ready state:", {
            streamReady: this.streamReady,
            trackCount: this.trackCount,
            connectionState: this.pc ? this.pc.connectionState : "no pc",
            iceConnectionState: this.pc ? this.pc.iceConnectionState : "no pc",
        });

        // Consider the stream ready when:
        // 1. We have at least one track
        // 2. Connection state is 'connected' OR ice connection state is 'connected' or 'completed'
        const connectionReady = this.pc && (this.pc.connectionState === "connected" || this.pc.iceConnectionState === "connected" || this.pc.iceConnectionState === "completed");

        if (!this.streamReady && this.trackCount > 0 && connectionReady) {
            log("Stream is now READY! Triggering onReady event");
            this.streamReady = true;

            // Get the streams from tracks
            const streams: MediaStream[] = [];
            if (this.pc) {
                this.pc.getReceivers().forEach((receiver) => {
                    if (receiver.track && receiver.track.readyState === "live") {
                        const stream = new MediaStream([receiver.track]);
                        streams.push(stream);
                    }
                });
            }

            // Call the onReady callback if it exists
            if (this.conf.onReady) {
                log("Calling onReady with streams:", streams.length);
                try {
                    this.conf.onReady({
                        streams: streams.length > 0 ? streams : null,
                        trackCount: this.trackCount,
                    });
                } catch (e) {
                    console.error("Error in onReady callback:", e);
                }
            } else {
                console.warn("onReady callback is not defined!");
            }
        }
    };

    private onTrack = (evt: RTCTrackEvent): void => {
        log("onTrack called with streams:", evt.streams ? evt.streams.length : 0);

        // Pass the track to the original onTrack callback
        if (this.conf.onTrack) {
            try {
                this.conf.onTrack(evt);
            } catch (e) {
                console.error("Error in onTrack callback:", e);
            }
        }

        // Increment track counter
        this.trackCount++;
        log("Track count increased to:", this.trackCount);

        // Check if the stream is ready
        this.checkReadyState();
    };

    private sendOffer = (offer: string): Promise<string> => {
        const headers = {
            "Content-Type": "application/sdp",
            ...this.getAuthHeaders(),
        };

        return fetch(this.cleanUrl, {
            method: "POST",
            headers,
            body: offer,
        }).then((res) => {
            switch (res.status) {
                case 201:
                    break;
                case 401:
                    throw new Error("authentication failed");
                case 403:
                    throw new Error("access denied");
                case 404:
                    throw new Error("stream not found");
                case 400:
                    return res.json().then((e: any) => {
                        throw new Error(e.error);
                    });
                default:
                    throw new Error(`bad status code ${res.status}`);
            }

            this.sessionUrl = new URL(res.headers.get("location")!, this.cleanUrl).toString();

            return res.text();
        });
    };

    private setAnswer = (answer: string): Promise<void> | undefined => {
        if (this.state !== "running") {
            return;
        }

        return this.pc!.setRemoteDescription(
            new RTCSessionDescription({
                type: "answer",
                sdp: answer,
            }),
        ).then(() => {
            if (this.queuedCandidates.length !== 0) {
                this.sendLocalCandidates(this.queuedCandidates);
                this.queuedCandidates = [];
            }
        });
    };

    private onLocalCandidate = (evt: RTCPeerConnectionIceEvent): void => {
        if (this.state !== "running") {
            return;
        }

        if (evt.candidate !== null) {
            if (this.sessionUrl === null) {
                this.queuedCandidates.push(evt.candidate);
            } else {
                this.sendLocalCandidates([evt.candidate]);
            }
        }
    };

    private sendLocalCandidates = (candidates: RTCIceCandidate[]): void => {
        const headers = {
            "Content-Type": "application/trickle-ice-sdpfrag",
            "If-Match": "*",
            ...this.getAuthHeaders(),
        };

        fetch(this.sessionUrl!, {
            method: "PATCH",
            headers,
            body: generateSdpFragment(this.offerData!, candidates),
        })
            .then((res) => {
                switch (res.status) {
                    case 204:
                        break;
                    case 401:
                        throw new Error("authentication failed");
                    case 403:
                        throw new Error("access denied");
                    case 404:
                        throw new Error("stream not found");
                    default:
                        throw new Error(`bad status code ${res.status}`);
                }
            })
            .catch((err) => {
                this.handleError(err.toString());
            });
    };

    private onConnectionState = (): void => {
        if (this.state !== "running") {
            return;
        }

        // "closed" can arrive before "failed" and without
        // the close() method being called at all.
        // It happens when the other peer sends a termination
        // message like a DTLS CloseNotify.
        if (this.pc!.connectionState === "failed" || this.pc!.connectionState === "closed") {
            this.handleError("peer connection closed");
        }
    };

    public cleanup = (): void => {
        // Clear any pending restart timeouts
        if (this.restartTimeout !== null) {
            window.clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }

        // Close peer connection
        if (this.pc !== null) {
            this.pc.close();
            this.pc = null;
        }

        this.sessionUrl = null;
        this.offerData = null;
        this.queuedCandidates = [];
        this.streamReady = false;
        this.trackCount = 0;
        this.state = "closed";
    };
}
