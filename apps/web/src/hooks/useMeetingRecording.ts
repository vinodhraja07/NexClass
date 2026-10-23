import { useCallback, useEffect, useRef, useState } from "react";
import type { MeetingTransport } from "@/lib/transport";
import { getAuthToken } from "@/lib/api";

export interface RecordingPublic {
  id: string;
  meetingCode: string;
  fileName: string;
  sizeBytes: number;
  fileSize?: number;
  durationSeconds: number;
  recordedBy?: string | null;
  recordedByName?: string;
  createdAt: string;
  downloadUrl: string;
  streamUrl: string;
}

export interface RecordingStatePayload {
  isRecording: boolean;
  isPaused: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  recordedBy: string | null;
}

export interface UseMeetingRecordingOptions {
  meetingCode: string;
  participantId?: string | null;
  participantName?: string;
  isHost?: boolean;
  transport?: MeetingTransport;
  localStream?: MediaStream | null;
  remoteStreams?: Record<string, MediaStream | null | undefined>;
  screenStream?: MediaStream | null;
  activeSpeakerName?: string;
  currentCaption?: string;
}

export interface UseMeetingRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  durationSeconds: number;
  formattedDuration: string;
  recordedBy: string | null;
  recordings: RecordingPublic[];
  loadingRecordings: boolean;
  uploading: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<{ blob: Blob | null; downloadUrl: string | null; recording: RecordingPublic | null }>;
  fetchRecordings: () => Promise<RecordingPublic[]>;
}

export function formatRecordingDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

function getSupportedMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "video/webm";
  }
  const preferred = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const type of preferred) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

/**
 * Web Audio API Multi-Source Audio Mixer
 * Combines local mic stream, remote peer streams, and translated voice playback
 * into a single unified MediaStreamAudioDestinationNode track.
 */
class MeetingAudioMixer {
  private ctx: AudioContext | null = null;
  private dest: MediaStreamAudioDestinationNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private peerSources: Map<string, { source: MediaStreamAudioSourceNode; stream: MediaStream }> = new Map();
  private peerGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private dummyOsc: OscillatorNode | null = null;
  private dummyGain: GainNode | null = null;

  constructor() {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx({ sampleRate: 48000 });
      this.dest = this.ctx.createMediaStreamDestination();
      this.micGain = this.ctx.createGain();
      this.peerGain = this.ctx.createGain();
      this.voiceGain = this.ctx.createGain();

      this.micGain.connect(this.dest);
      this.peerGain.connect(this.dest);
      this.voiceGain.connect(this.dest);

      // Low inaudible carrier to prevent MediaRecorder starvation when all tracks are silent
      this.dummyGain = this.ctx.createGain();
      this.dummyGain.gain.value = 0.00001;
      this.dummyOsc = this.ctx.createOscillator();
      this.dummyOsc.connect(this.dummyGain);
      this.dummyGain.connect(this.dest);
      this.dummyOsc.start();
    } catch (err) {
      console.warn("MeetingAudioMixer initialization warning:", err);
    }
  }

  public updateLocalMic(stream: MediaStream | null | undefined) {
    if (!this.ctx || !this.micGain) return;
    const tracks = stream?.getAudioTracks() ?? [];
    if (tracks.length === 0) {
      if (this.micSource) {
        try {
          this.micSource.disconnect();
        } catch {}
        this.micSource = null;
      }
      return;
    }

    try {
      if (this.micSource) {
        try {
          this.micSource.disconnect();
        } catch {}
      }
      this.micSource = this.ctx.createMediaStreamSource(new MediaStream([tracks[0]]));
      this.micSource.connect(this.micGain);
    } catch (err) {
      console.warn("MeetingAudioMixer: failed to connect mic stream", err);
    }
  }

  public updateRemoteStreams(streams: Record<string, MediaStream | null | undefined>) {
    if (!this.ctx || !this.peerGain) return;
    const activeIds = new Set(Object.keys(streams));

    // Remove detached peer sources
    for (const [id, entry] of this.peerSources.entries()) {
      if (!activeIds.has(id)) {
        try {
          entry.source.disconnect();
        } catch {}
        this.peerSources.delete(id);
      }
    }

    // Connect new or changed peer streams
    for (const [id, stream] of Object.entries(streams)) {
      if (!stream) continue;
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) continue;

      const existing = this.peerSources.get(id);
      if (existing && existing.stream === stream) continue;

      if (existing) {
        try {
          existing.source.disconnect();
        } catch {}
      }

      try {
        const source = this.ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
        source.connect(this.peerGain);
        this.peerSources.set(id, { source, stream });
      } catch (err) {
        console.warn(`MeetingAudioMixer: failed to connect peer audio (${id})`, err);
      }
    }
  }

  public connectAudioElement(audio: HTMLAudioElement) {
    if (!this.ctx || !this.voiceGain) return;
    try {
      const src = this.ctx.createMediaElementSource(audio);
      src.connect(this.voiceGain);
      src.connect(this.ctx.destination);
    } catch {
      // Audio element might already be attached or cross-origin
    }
  }

  public getMixedTrack(): MediaStreamTrack | null {
    if (!this.dest) return null;
    const tracks = this.dest.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  public async resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {}
    }
  }

  public close() {
    try {
      if (this.dummyOsc) {
        this.dummyOsc.stop();
        this.dummyOsc.disconnect();
      }
      if (this.micSource) {
        this.micSource.disconnect();
      }
      for (const entry of this.peerSources.values()) {
        entry.source.disconnect();
      }
      this.peerSources.clear();
      this.ctx?.close();
    } catch {}
  }
}

/**
 * Canvas Stage Compositor (1280x720 @ 30fps)
 * Captures video elements, screen share, participant avatars, speaker glow, and burned-in subtitles.
 */
class MeetingCanvasCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private animFrameId: number | null = null;
  private videoElements = new Map<string, HTMLVideoElement>();
  private screenVideo: HTMLVideoElement | null = null;

  constructor(private width = 1280, private height = 720) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d", { alpha: false });
  }

  private getOrCreateVideo(key: string, stream: MediaStream): HTMLVideoElement {
    let video = this.videoElements.get(key);
    if (!video) {
      video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.display = "none";
      document.body.appendChild(video);
      this.videoElements.set(key, video);
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
    return video;
  }

  public start(getRenderData: () => {
    localStream?: MediaStream | null;
    remoteStreams?: Record<string, MediaStream | null | undefined>;
    screenStream?: MediaStream | null;
    participantName?: string;
    activeSpeakerName?: string;
    currentCaption?: string;
    meetingCode?: string;
    elapsedSeconds: number;
  }) {
    const render = () => {
      const data = getRenderData();
      this.draw(data);
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  private draw(data: {
    localStream?: MediaStream | null;
    remoteStreams?: Record<string, MediaStream | null | undefined>;
    screenStream?: MediaStream | null;
    participantName?: string;
    activeSpeakerName?: string;
    currentCaption?: string;
    meetingCode?: string;
    elapsedSeconds: number;
  }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    // Background gradient (Google Meet Dark Surface)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0b0f17");
    bgGrad.addColorStop(1, "#151d2a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const hasScreenShare =
      Boolean(data.screenStream) &&
      (data.screenStream?.getVideoTracks().length ?? 0) > 0 &&
      data.screenStream!.getVideoTracks()[0].readyState === "live";

    if (hasScreenShare && data.screenStream) {
      // Screen share active: draw full canvas screen presentation
      if (!this.screenVideo) {
        this.screenVideo = document.createElement("video");
        this.screenVideo.autoplay = true;
        this.screenVideo.playsInline = true;
        this.screenVideo.muted = true;
        this.screenVideo.style.display = "none";
        document.body.appendChild(this.screenVideo);
      }
      if (this.screenVideo.srcObject !== data.screenStream) {
        this.screenVideo.srcObject = data.screenStream;
        this.screenVideo.play().catch(() => {});
      }

      if (this.screenVideo.readyState >= 2 && this.screenVideo.videoWidth > 0) {
        // Fit aspect ratio
        const vw = this.screenVideo.videoWidth;
        const vh = this.screenVideo.videoHeight;
        const scale = Math.min(w / vw, h / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(this.screenVideo, dx, dy, dw, dh);
      }

      // PiP presenter webcam in bottom-right corner
      if (data.localStream && data.localStream.getVideoTracks().length > 0) {
        const localVid = this.getOrCreateVideo("local_pip", data.localStream);
        if (localVid.readyState >= 2 && localVid.videoWidth > 0) {
          const pipW = 220;
          const pipH = 124;
          const pipX = w - pipW - 24;
          const pipY = h - pipH - 64;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 12);
          ctx.clip();
          ctx.drawImage(localVid, pipX, pipY, pipW, pipH);
          ctx.restore();

          // Border
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 12);
          ctx.strokeStyle = "#00d084";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    } else {
      // Video grid layout
      const tiles: { key: string; name: string; stream: MediaStream | null }[] = [];
      tiles.push({
        key: "local",
        name: data.participantName || "You (Host)",
        stream: data.localStream || null,
      });

      if (data.remoteStreams) {
        for (const [id, s] of Object.entries(data.remoteStreams)) {
          if (s) {
            tiles.push({
              key: id,
              name: `Participant ${id.slice(-4)}`,
              stream: s,
            });
          }
        }
      }

      const count = Math.max(1, tiles.length);
      let cols = 1;
      let rows = 1;
      if (count === 2) {
        cols = 2;
        rows = 1;
      } else if (count <= 4) {
        cols = 2;
        rows = 2;
      } else if (count <= 6) {
        cols = 3;
        rows = 2;
      } else {
        cols = 4;
        rows = 2;
      }

      const padding = 16;
      const tileW = (w - padding * (cols + 1)) / cols;
      const tileH = (h - padding * (rows + 1) - 40) / rows; // leave 40px for top bar

      tiles.forEach((tile, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const x = padding + c * (tileW + padding);
        const y = 48 + padding + r * (tileH + padding);

        // Tile background
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, tileW, tileH, 12);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.clip();

        let drewVideo = false;
        if (tile.stream && tile.stream.getVideoTracks().length > 0) {
          const track = tile.stream.getVideoTracks()[0];
          if (track.enabled && track.readyState === "live") {
            const vid = this.getOrCreateVideo(tile.key, tile.stream);
            if (vid.readyState >= 2 && vid.videoWidth > 0) {
              // Cover aspect ratio
              const vw = vid.videoWidth;
              const vh = vid.videoHeight;
              const tileRatio = tileW / tileH;
              const vidRatio = vw / vh;
              let sw = vw;
              let sh = vh;
              let sx = 0;
              let sy = 0;
              if (vidRatio > tileRatio) {
                sw = vh * tileRatio;
                sx = (vw - sw) / 2;
              } else {
                sh = vw / tileRatio;
                sy = (vh - sh) / 2;
              }
              ctx.drawImage(vid, sx, sy, sw, sh, x, y, tileW, tileH);
              drewVideo = true;
            }
          }
        }

        if (!drewVideo) {
          // Camera off: Draw avatar circle with initial
          const cx = x + tileW / 2;
          const cy = y + tileH / 2;
          const radius = Math.min(tileW, tileH) * 0.18;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = "#334155";
          ctx.fill();

          ctx.fillStyle = "#94a3b8";
          ctx.font = `bold ${Math.max(16, Math.floor(radius * 0.9))}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const initial = (tile.name || "U").charAt(0).toUpperCase();
          ctx.fillText(initial, cx, cy);
        }

        ctx.restore();

        // Name tag pill
        ctx.save();
        ctx.beginPath();
        const tagH = 24;
        const tagY = y + tileH - tagH - 8;
        const tagX = x + 8;
        ctx.roundRect(tagX, tagY, Math.min(tileW - 16, 160), tagH, 6);
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.fill();

        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 11px Inter, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(tile.name, tagX + 8, tagY + tagH / 2, tileW - 32);
        ctx.restore();
      });
    }

    // Top Header Watermark
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.fillRect(0, 0, w, 44);

    // Brand logo + text
    ctx.fillStyle = "#00d084";
    ctx.font = "bold 15px Sora, Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("NexClass", 20, 22);

    if (data.meetingCode) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 13px JetBrains Mono, monospace";
      ctx.fillText(`•  ${data.meetingCode.toUpperCase()}`, 100, 22);
    }

    // Pulsing Red REC Pill (Top Right)
    const recX = w - 140;
    const recY = 10;
    ctx.beginPath();
    ctx.roundRect(recX, recY, 120, 24, 12);
    ctx.fillStyle = "rgba(225, 29, 72, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "#e11d48";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red dot
    ctx.beginPath();
    ctx.arc(recX + 16, recY + 12, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f43f5e";
    ctx.fill();

    // REC text + duration
    ctx.fillStyle = "#ffe4e6";
    ctx.font = "bold 11px Inter, monospace, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`REC ${formatRecordingDuration(data.elapsedSeconds)}`, recX + 28, recY + 12);
    ctx.restore();

    // Burned-in Subtitles Overlay (bottom center)
    if (data.currentCaption && data.currentCaption.trim()) {
      ctx.save();
      const capText = data.currentCaption.trim();
      ctx.font = "500 15px Inter, system-ui, sans-serif";
      const metrics = ctx.measureText(capText);
      const capW = Math.min(w - 60, Math.max(300, metrics.width + 48));
      const capH = 42;
      const capX = (w - capW) / 2;
      const capY = h - capH - 24;

      ctx.beginPath();
      ctx.roundRect(capX, capY, capW, capH, 21);
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(capText, w / 2, capY + capH / 2, capW - 32);
      ctx.restore();
    }
  }

  public getStream(fps = 30): MediaStream | null {
    if (typeof this.canvas.captureStream === "function") {
      return this.canvas.captureStream(fps);
    }
    return null;
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    for (const vid of this.videoElements.values()) {
      vid.pause();
      vid.srcObject = null;
      vid.remove();
    }
    this.videoElements.clear();

    if (this.screenVideo) {
      this.screenVideo.pause();
      this.screenVideo.srcObject = null;
      this.screenVideo.remove();
      this.screenVideo = null;
    }
  }
}

/**
 * useMeetingRecording Hook
 * Production-ready in-meeting recording pipeline combining:
 * 1. Web Audio API multi-channel mixer (mic + peer streams + translated audio)
 * 2. High-fidelity canvas/video stage compositor (1280x720 30fps)
 * 3. MediaRecorder capture with VP9/Opus WebM
 * 4. Instant client-side download (.webm)
 * 5. Automatic POST upload to /api/meetings/:code/recordings
 * 6. Realtime socket event synchronization
 */
export function useMeetingRecording({
  meetingCode,
  participantId,
  participantName = "User",
  isHost = false,
  transport,
  localStream,
  remoteStreams = {},
  screenStream,
  activeSpeakerName,
  currentCaption,
}: UseMeetingRecordingOptions): UseMeetingRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [recordedBy, setRecordedBy] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<RecordingPublic[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mixerRef = useRef<MeetingAudioMixer | null>(null);
  const compositorRef = useRef<MeetingCanvasCompositor | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);

  // References for live render loop
  const liveDataRef = useRef({
    localStream,
    remoteStreams,
    screenStream,
    participantName,
    activeSpeakerName,
    currentCaption,
    meetingCode,
    elapsedSeconds: 0,
  });

  useEffect(() => {
    liveDataRef.current = {
      localStream,
      remoteStreams,
      screenStream,
      participantName,
      activeSpeakerName,
      currentCaption,
      meetingCode,
      elapsedSeconds: durationSeconds,
    };
  }, [
    localStream,
    remoteStreams,
    screenStream,
    participantName,
    activeSpeakerName,
    currentCaption,
    meetingCode,
    durationSeconds,
  ]);

  // Update audio mixer when streams change
  useEffect(() => {
    if (mixerRef.current) {
      mixerRef.current.updateLocalMic(localStream);
      mixerRef.current.updateRemoteStreams(remoteStreams);
    }
  }, [localStream, remoteStreams]);

  // Fetch recordings list from API
  const fetchRecordings = useCallback(async (): Promise<RecordingPublic[]> => {
    if (!meetingCode) return [];
    setLoadingRecordings(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/meetings/${encodeURIComponent(meetingCode.toUpperCase())}/recordings`, {
        headers,
      });
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; recordings: RecordingPublic[] };
        if (data.ok && Array.isArray(data.recordings)) {
          setRecordings(data.recordings);
          return data.recordings;
        }
      }
      return [];
    } catch (err) {
      console.warn("Failed to fetch recordings:", err);
      return [];
    } finally {
      setLoadingRecordings(false);
    }
  }, [meetingCode]);

  // Load initial recordings on mount or meetingCode change
  useEffect(() => {
    if (meetingCode) {
      void fetchRecordings();
    }
  }, [meetingCode, fetchRecordings]);

  // Socket listener for room-wide recording state broadcast
  useEffect(() => {
    if (!transport) return;

    const onState = (state: RecordingStatePayload) => {
      setIsRecording(state.isRecording);
      setIsPaused(state.isPaused);
      if (state.isRecording) {
        setDurationSeconds(state.elapsedSeconds);
        setRecordedBy(state.recordedBy);
      } else {
        setRecordedBy(null);
      }
    };

    const unsub = (transport as { on?: (event: string, handler: (payload: unknown) => void) => () => void }).on?.(
      "recording:state",
      (payload: unknown) => onState(payload as RecordingStatePayload),
    );

    return () => {
      unsub?.();
    };
  }, [transport]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setError(null);
    chunksRef.current = [];

    try {
      // 1. Initialize Web Audio API Mixer
      const mixer = new MeetingAudioMixer();
      await mixer.resume();
      mixer.updateLocalMic(localStream);
      mixer.updateRemoteStreams(remoteStreams);
      mixerRef.current = mixer;

      // 2. Initialize Canvas Stage Compositor
      const compositor = new MeetingCanvasCompositor(1280, 720);
      compositor.start(() => liveDataRef.current);
      compositorRef.current = compositor;

      // 3. Assemble combined MediaStream
      const canvasStream = compositor.getStream(30);
      const mixedTrack = mixer.getMixedTrack();

      const combinedTracks: MediaStreamTrack[] = [];
      if (canvasStream && canvasStream.getVideoTracks().length > 0) {
        combinedTracks.push(canvasStream.getVideoTracks()[0]);
      }
      if (mixedTrack) {
        combinedTracks.push(mixedTrack);
      }

      if (combinedTracks.length === 0) {
        throw new Error("No media tracks available to record.");
      }

      const combinedStream = new MediaStream(combinedTracks);
      const mimeType = getSupportedMimeType();

      // 4. Create MediaRecorder
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorderRef.current = recorder;
      recorder.start(1000);

      setIsRecording(true);
      setIsPaused(false);
      setDurationSeconds(0);
      setRecordedBy(participantId ?? null);
      recordingStartTimeRef.current = Date.now();

      // Start elapsed timer
      timerRef.current = window.setInterval(() => {
        setDurationSeconds((sec) => sec + 1);
      }, 1000);

      // 5. Notify socket
      if (transport) {
        (transport as { emit?: (event: string, payload: unknown) => void }).emit?.("recording:start", {
          meetingCode: meetingCode.toUpperCase(),
          participantId,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start meeting recording.";
      setError(msg);
      setIsRecording(false);
      mixerRef.current?.close();
      mixerRef.current = null;
      compositorRef.current?.stop();
      compositorRef.current = null;
      throw err;
    }
  }, [isRecording, localStream, remoteStreams, participantId, meetingCode, transport]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!recorderRef.current || recorderRef.current.state !== "recording") return;
    try {
      recorderRef.current.pause();
      setIsPaused(true);
      window.clearInterval(timerRef.current);
      if (transport) {
        (transport as { emit?: (event: string, payload: unknown) => void }).emit?.("recording:pause", {
          meetingCode: meetingCode.toUpperCase(),
          participantId,
        });
      }
    } catch (err) {
      console.warn("Failed to pause recording:", err);
    }
  }, [transport, meetingCode, participantId]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!recorderRef.current || recorderRef.current.state !== "paused") return;
    try {
      recorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setDurationSeconds((sec) => sec + 1);
      }, 1000);
      if (transport) {
        (transport as { emit?: (event: string, payload: unknown) => void }).emit?.("recording:resume", {
          meetingCode: meetingCode.toUpperCase(),
          participantId,
        });
      }
    } catch (err) {
      console.warn("Failed to resume recording:", err);
    }
  }, [transport, meetingCode, participantId]);

  // Stop recording
  const stopRecording = useCallback((): Promise<{
    blob: Blob | null;
    downloadUrl: string | null;
    recording: RecordingPublic | null;
  }> => {
    return new Promise((resolve) => {
      window.clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      const finalDuration = durationSeconds;

      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        setIsPaused(false);
        resolve({ blob: null, downloadUrl: null, recording: null });
        return;
      }

      recorder.onstop = async () => {
        try {
          const mimeType = recorder.mimeType || "video/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });

          // 1. Instant local download
          let downloadUrl: string | null = null;
          if (blob.size > 0 && typeof document !== "undefined") {
            downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = downloadUrl;
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            a.download = `nexclass-${meetingCode.toLowerCase()}-${timestamp}.webm`;
            document.body.appendChild(a);
            a.click();
            window.setTimeout(() => {
              if (document.body.contains(a)) document.body.removeChild(a);
            }, 1000);
          }

          // 2. Upload to server archive storage
          let serverRecording: RecordingPublic | null = null;
          if (blob.size > 0 && meetingCode) {
            setUploading(true);
            try {
              const token = getAuthToken();
              const headers: Record<string, string> = {
                "Content-Type": blob.type || "video/webm",
                "x-recording-duration": String(finalDuration),
                "x-recording-size": String(blob.size),
              };
              if (participantId) {
                headers["x-recorded-by"] = participantId;
              }
              if (token) {
                headers["Authorization"] = `Bearer ${token}`;
              }

              const res = await fetch(`/api/meetings/${encodeURIComponent(meetingCode.toUpperCase())}/recordings`, {
                method: "POST",
                headers,
                body: blob,
              });

              if (res.ok) {
                const data = (await res.json()) as { ok: boolean; recording: RecordingPublic };
                if (data.ok && data.recording) {
                  serverRecording = data.recording;
                  setRecordings((prev) => [data.recording, ...prev.filter((r) => r.id !== data.recording.id)]);
                }
              }
            } catch (uploadErr) {
              console.warn("Failed to upload recording to server archive:", uploadErr);
            } finally {
              setUploading(false);
            }
          }

          // 3. Cleanup audio mixer & compositor
          mixerRef.current?.close();
          mixerRef.current = null;
          compositorRef.current?.stop();
          compositorRef.current = null;
          recorderRef.current = null;

          setIsRecording(false);
          setIsPaused(false);

          // 4. Notify socket
          if (transport) {
            (transport as { emit?: (event: string, payload: unknown) => void }).emit?.("recording:stop", {
              meetingCode: meetingCode.toUpperCase(),
              participantId,
            });
          }

          resolve({ blob, downloadUrl, recording: serverRecording });
        } catch (err) {
          console.error("Error stopping recording pipeline:", err);
          setIsRecording(false);
          setIsPaused(false);
          resolve({ blob: null, downloadUrl: null, recording: null });
        }
      };

      try {
        recorder.stop();
      } catch {
        recorder.onstop?.(new Event("stop"));
      }
    });
  }, [durationSeconds, meetingCode, participantId, transport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {}
      }
      mixerRef.current?.close();
      compositorRef.current?.stop();
    };
  }, []);

  return {
    isRecording,
    isPaused,
    durationSeconds,
    formattedDuration: formatRecordingDuration(durationSeconds),
    recordedBy,
    recordings,
    loadingRecordings,
    uploading,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    fetchRecordings,
  };
}
