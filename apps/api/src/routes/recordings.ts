import { Router } from "express";
import { Readable } from "node:stream";
import { MeetingModel } from "../models/index";
import { optionalAuth } from "../middleware/auth";
import { HttpError } from "../middleware/errors";
import {
  downloadRecording,
  findRecordingById,
  findRecordingsByMeeting,
  saveRecordingStream,
  streamRecording,
} from "../services/recordings";
import { toRecordingPublic } from "../models/recording";

const router = Router();

async function findMeeting(code: string) {
  const meeting = await MeetingModel.findOne({ code: code.toUpperCase() });
  if (!meeting) {
    throw new HttpError(404, "Meeting not found.", "meeting_not_found");
  }
  return meeting;
}

/**
 * POST /api/meetings/:code/recordings
 * Upload binary recording stream directly to disk.
 */
router.post("/meetings/:code/recordings", optionalAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);

    const durationHeader = req.headers["x-recording-duration"];
    const durationSeconds = durationHeader ? parseFloat(String(durationHeader)) : 0;

    const sizeHeader = req.headers["x-recording-size"];
    const sizeBytes = sizeHeader ? parseInt(String(sizeHeader), 10) : 0;

    const recordedBy =
      (req.headers["x-recorded-by"] as string) || req.auth?.sub || null;
    const recordedByName = req.auth?.name || "";

    const rawContentType = req.headers["content-type"] || "video/webm";
    const mimeType = rawContentType.split(";")[0].trim() || "video/webm";

    // Create stream from buffer if express parsed or supertest sent buffer, else use req stream
    const inputStream: NodeJS.ReadableStream = Buffer.isBuffer(req.body)
      ? Readable.from(req.body)
      : req;

    const recording = await saveRecordingStream({
      meetingCode: meeting.code,
      meetingId: meeting.id,
      stream: inputStream,
      mimeType,
      durationSeconds: isNaN(durationSeconds) ? 0 : durationSeconds,
      sizeBytes: isNaN(sizeBytes) ? 0 : sizeBytes,
      recordedBy,
      recordedByName,
    });

    res.status(201).json({
      ok: true,
      recording: toRecordingPublic(recording),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/:code/recordings
 * List all saved recordings for a meeting.
 */
router.get("/meetings/:code/recordings", optionalAuth, async (req, res, next) => {
  try {
    const meeting = await findMeeting(req.params.code);
    const recordings = await findRecordingsByMeeting(meeting.code);

    res.json({
      ok: true,
      recordings: recordings.map(toRecordingPublic),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/:code/recordings/:id/stream
 * Range-capable streaming playback with HTTP 206 Partial Content.
 */
router.get("/meetings/:code/recordings/:id/stream", optionalAuth, async (req, res, next) => {
  try {
    await findMeeting(req.params.code);
    const recording = await findRecordingById(req.params.id);
    if (!recording || recording.meetingCode !== req.params.code.toUpperCase()) {
      throw new HttpError(404, "Recording not found.", "recording_not_found");
    }

    streamRecording(recording, {
      rangeHeader: req.headers.range,
      req,
      res,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/:code/recordings/:id/download
 * File download with Content-Disposition attachment.
 */
router.get("/meetings/:code/recordings/:id/download", optionalAuth, async (req, res, next) => {
  try {
    await findMeeting(req.params.code);
    const recording = await findRecordingById(req.params.id);
    if (!recording || recording.meetingCode !== req.params.code.toUpperCase()) {
      throw new HttpError(404, "Recording not found.", "recording_not_found");
    }

    downloadRecording(recording, res);
  } catch (error) {
    next(error);
  }
});

/**
 * Standalone direct stream URL fallback: GET /api/recordings/:id/stream
 */
router.get("/recordings/:id/stream", optionalAuth, async (req, res, next) => {
  try {
    const recording = await findRecordingById(req.params.id);
    if (!recording) {
      throw new HttpError(404, "Recording not found.", "recording_not_found");
    }

    streamRecording(recording, {
      rangeHeader: req.headers.range,
      req,
      res,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Standalone direct download URL fallback: GET /api/recordings/:id/download
 */
router.get("/recordings/:id/download", optionalAuth, async (req, res, next) => {
  try {
    const recording = await findRecordingById(req.params.id);
    if (!recording) {
      throw new HttpError(404, "Recording not found.", "recording_not_found");
    }

    downloadRecording(recording, res);
  } catch (error) {
    next(error);
  }
});

export default router;
