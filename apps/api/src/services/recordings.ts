import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { RecordingModel, type RecordingDoc } from "../models/recording";

let customRecordingsDir: string | null = null;

export function setRecordingsDir(dir: string | null): void {
  customRecordingsDir = dir;
}

export function getRecordingsDir(): string {
  if (customRecordingsDir) {
    fs.mkdirSync(customRecordingsDir, { recursive: true });
    return customRecordingsDir;
  }
  if (process.env.RECORDINGS_DIR) {
    const dir = path.resolve(process.env.RECORDINGS_DIR);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  if (fs.existsSync("/app/recordings")) {
    return "/app/recordings";
  }
  const fallback = path.resolve(process.cwd(), "recordings");
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

export function generateRecordingFileName(meetingCode: string, mimeType = "video/webm"): string {
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeCode = meetingCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `recording_${safeCode}_${timestamp}_${random}.${ext}`;
}

export interface SaveRecordingOptions {
  meetingCode: string;
  meetingId?: string;
  stream: NodeJS.ReadableStream;
  mimeType?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  recordedBy?: string | null;
  recordedByName?: string;
  fileName?: string;
}

export async function saveRecordingStream(options: SaveRecordingOptions): Promise<RecordingDoc> {
  const dir = getRecordingsDir();
  const mimeType = options.mimeType || "video/webm";
  const fileName = options.fileName || generateRecordingFileName(options.meetingCode, mimeType);
  const filePath = path.join(dir, fileName);

  const writeStream = fs.createWriteStream(filePath);
  let writtenBytes = 0;

  await new Promise<void>((resolve, reject) => {
    options.stream.on("data", (chunk: Buffer) => {
      writtenBytes += chunk.length;
    });
    options.stream.pipe(writeStream);
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // ignore
      }
      reject(err);
    });
    options.stream.on("error", (err) => {
      try {
        writeStream.destroy();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // ignore
      }
      reject(err);
    });
  });

  const stat = fs.statSync(filePath);
  const actualSize = stat.size || writtenBytes || options.sizeBytes || 0;

  const recording = await RecordingModel.create({
    meetingCode: options.meetingCode.toUpperCase(),
    meetingId: options.meetingId,
    fileName,
    filePath,
    mimeType,
    sizeBytes: actualSize,
    fileSize: actualSize,
    durationSeconds: options.durationSeconds ?? 0,
    recordedBy: options.recordedBy ?? null,
    recordedByName: options.recordedByName,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return recording;
}

export async function findRecordingsByMeeting(meetingCode: string): Promise<RecordingDoc[]> {
  return RecordingModel.find({ meetingCode: meetingCode.toUpperCase() })
    .sort({ createdAt: -1 })
    .exec();
}

export async function findRecordingById(id: string): Promise<RecordingDoc | null> {
  return RecordingModel.findById(id);
}

export interface StreamRecordingOptions {
  rangeHeader?: string;
  req?: Request;
  res: Response;
}

export function streamRecording(recording: RecordingDoc, options: StreamRecordingOptions): void {
  const { rangeHeader, res } = options;

  if (!fs.existsSync(recording.filePath)) {
    res.status(404).json({ ok: false, error: "Recording file not found on disk." });
    return;
  }

  const stat = fs.statSync(recording.filePath);
  const fileSize = stat.size;
  const mimeType = recording.mimeType || "video/webm";

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (!match) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      res.sendStatus(416);
      return;
    }

    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (!match[1] && match[2]) {
      const suffixLength = parseInt(match[2], 10);
      start = Math.max(0, fileSize - suffixLength);
      end = fileSize - 1;
    }

    if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      res.sendStatus(416);
      return;
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
    });

    const stream = fs.createReadStream(recording.filePath, { start, end });
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Content-Length": fileSize,
      "Content-Type": mimeType,
    });

    const stream = fs.createReadStream(recording.filePath);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
    stream.pipe(res);
  }
}

export function downloadRecording(recording: RecordingDoc, res: Response): void {
  if (!fs.existsSync(recording.filePath)) {
    res.status(404).json({ ok: false, error: "Recording file not found on disk." });
    return;
  }

  const stat = fs.statSync(recording.filePath);
  const fileName = recording.fileName || `nexclass-recording-${recording.meetingCode}.webm`;

  res.writeHead(200, {
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Content-Length": stat.size,
    "Content-Type": recording.mimeType || "video/webm",
  });

  const stream = fs.createReadStream(recording.filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
  stream.pipe(res);
}

export async function deleteRecording(id: string): Promise<boolean> {
  const recording = await RecordingModel.findById(id);
  if (!recording) return false;
  try {
    if (fs.existsSync(recording.filePath)) {
      fs.unlinkSync(recording.filePath);
    }
  } catch {
    // continue
  }
  await RecordingModel.deleteMany({ id });
  return true;
}
