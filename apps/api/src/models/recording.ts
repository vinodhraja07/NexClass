import { Schema } from "mongoose";
import { registerModel, type ModelLike } from "../db/model";

export interface RecordingDoc {
  id?: string;
  meetingId?: string;
  meetingCode: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  fileSize?: number;
  durationSeconds: number;
  recordedBy?: string | null;
  recordedByName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

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

export function toRecordingPublic(recording: RecordingDoc): RecordingPublic {
  const id = recording.id ?? "";
  const code = recording.meetingCode;
  const size = recording.sizeBytes ?? recording.fileSize ?? 0;
  return {
    id,
    meetingCode: code,
    fileName: recording.fileName,
    sizeBytes: size,
    fileSize: size,
    durationSeconds: recording.durationSeconds ?? 0,
    recordedBy: recording.recordedBy ?? null,
    recordedByName: recording.recordedByName,
    createdAt: recording.createdAt ? new Date(recording.createdAt).toISOString() : new Date().toISOString(),
    downloadUrl: `/api/meetings/${code}/recordings/${id}/download`,
    streamUrl: `/api/meetings/${code}/recordings/${id}/stream`,
  };
}

const recordingSchema = new Schema<RecordingDoc>(
  {
    meetingId: { type: String, default: null, index: true },
    meetingCode: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, default: "video/webm" },
    sizeBytes: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    recordedBy: { type: String, default: null },
    recordedByName: { type: String, default: "" },
  },
  { timestamps: true },
);

export const RecordingModel: ModelLike<RecordingDoc> = registerModel<RecordingDoc>(
  "Recording",
  recordingSchema,
  () => ({
    meetingCode: "",
    fileName: "",
    filePath: "",
    mimeType: "video/webm",
    sizeBytes: 0,
    fileSize: 0,
    durationSeconds: 0,
    recordedBy: null,
    recordedByName: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
);
