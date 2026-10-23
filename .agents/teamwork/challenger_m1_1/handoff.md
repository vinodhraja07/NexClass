# Handoff Report — Milestone 1 Empirical Challenge (Challenger 1)

## Verdict: REQUEST_CHANGES

---

## 1. Observation

Direct observations from empirical execution of the stress test suite `apps/api/tests/recording-adversarial.test.ts` (20 tests executed via Vitest):

1. **Baseline and Bit-for-Bit Byte Integrity**:
   - Small binary payload (512B high-entropy buffer with null bytes and 0xFF): SHA-256 matched between original, disk file (`filePath`), download endpoint (`/api/meetings/:code/recordings/:id/download`), and full stream (`/api/meetings/:code/recordings/:id/stream`).
   - Medium binary payload (256KB) with intentional `x-recording-size: 999999` header mismatch: Server correctly stored actual 262,144 bytes based on `fs.statSync` rather than trusting the header.
   - Chunked streaming upload (1MB across 16KB stream chunks): SHA-256 matched bit-for-bit with disk storage.
   - Faulty stream upload abortion: Partial file was cleanly unlinked by `writeStream.on("error")` handler.
   - Complete file reassembly: 64KB file fetched via 16 consecutive 4KB range slices (`bytes=0-4095`, `bytes=4096-8191`, ...) concatenated bit-for-bit matched original file SHA-256.
   - Multi-room concurrent stream uploads: Concurrent uploads across different meetings preserved isolation without cross-talk or metadata leaks.

2. **Empirical Bug 1: HTTP 206 Range Clamping Violation (RFC 9110 §14.1.2)**
   - **Command**: `npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api -- recording-adversarial`
   - **Verbatim Error**:
     ```
     FAIL tests/recording-adversarial.test.ts > Adversarial Empirical Challenge: Recording & Signaling > 2. HTTP 206 Range Requests & Slice Reassembly > tests Range header with end >= fileSize (RFC 9110 §14.1.2 requires clamping end = fileSize - 1)
     AssertionError: expected 416 to be 206 // Object.is equality

     - Expected
     + Received

     - 206
     + 416

      ❯ tests/recording-adversarial.test.ts:450:26
         448| 
         449|       // Check if server returns 206 Partial Content with clamped range
         450|       expect(res.status).toBe(206);
            |                          ^
         451|       expect(res.headers["content-range"]).toBe(`bytes 0-${TOTAL_BYTES - 1}/${TOTAL_BYTES}`);
         452|       expect(res.headers["content-length"]).toBe(String(TOTAL_BYTES));
     ```
   - **Code Location**: `apps/api/src/services/recordings.ts` lines 145–158:
     ```ts
     145:     let start = match[1] ? parseInt(match[1], 10) : 0;
     146:     let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
     ...
     154:     if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
     155:       res.setHeader("Content-Range", `bytes */${fileSize}`);
     156:       res.sendStatus(416);
     157:       return;
     158:     }
     ```
   - **Observed Behavior**: Requesting `Range: bytes=0-131072` on a 65,536-byte file returns `HTTP 416 Range Not Satisfiable`.

3. **Empirical Bug 2: Socket `recording:start` Non-Idempotent Destructive Reset**
   - **Command**: `npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api -- recording-adversarial`
   - **Verbatim Error**:
     ```
     FAIL tests/recording-adversarial.test.ts > Adversarial Empirical Challenge: Recording & Signaling > 4. Realtime Recording Socket State Machine > verifies error handling for aberrant state transitions (pause when not active, double start)
     AssertionError: expected undefined to be true // Object.is equality

     - Expected: 
     true

     + Received: 
     undefined

      ❯ tests/recording-adversarial.test.ts:780:45
         778|       });
         779|       expect(doubleStartRes!.ok).toBe(true);
         780|       expect(doubleStartRes!.alreadyActive).toBe(true);
            |                                             ^
         781|       expect(doubleStartRes!.state?.startedAt).toBe(originalStartedAt);
     ```
   - **Code Location**: `apps/api/src/realtime/socket.ts` lines 431–456:
     ```ts
     431:         const now = Date.now();
     432:         const internal: RoomRecordingInternal = {
     433:           isRecording: true,
     434:           isPaused: false,
     435:           startedAt: now,
     436:           segmentStartedAt: now,
     437:           accumulatedElapsedSeconds: 0,
     438:           recordedBy: participantId ?? null,
     439:         };
     440:         roomRecordingStates.set(code, internal);
     ```
   - **Observed Behavior**: Calling `recording:start` when recording is already active does NOT check `roomRecordingStates.get(code)`. It blindly overwrites `startedAt` with `now`, resets `accumulatedElapsedSeconds` to 0, clears `isPaused`, and re-broadcasts `recording:started` to the whole room.

---

## 2. Logic Chain

1. **RFC 9110 Compliance for Range Requests**:
   - RFC 9110 §14.1.2 explicitly specifies:
     > *"If the last-pos value is absent, or if the value is greater than or equal to the current length of the representation data, the byte range is interpreted as the remainder of the representation (i.e., the server treats the last-pos as being one less than the current length of the representation data)."*
     > *"A byte-range-spec is unsatisfactory if the first-byte-pos is greater than or equal to the current length of the selected representation, or if the last-byte-pos is less than its first-byte-pos."*
   - In `apps/api/src/services/recordings.ts:154`, the condition `end >= fileSize` causes any request where `end` exceeds the file length to abort with HTTP 416.
   - Standard browser media players (Chrome, Safari AVPlayer) frequently request fixed-size buffer slices (e.g. 1MB or 2MB) that exceed the size of small recordings or tail fragments.
   - When this happens, video playback fails on client devices with a 416 error instead of streaming the remainder of the file.
   - Fix required: Clamp `end = Math.min(end, fileSize - 1)` before validating, and only reject with 416 when `start >= fileSize` or `start > end`.

2. **Socket Recording State Integrity**:
   - In a collaborative classroom, a teacher or network client may issue duplicate `recording:start` events (network retransmission, double-clicking the button, opening a second browser window, or reconnecting).
   - Because `recording:start` does not check if recording is already active, emitting `recording:start` 10 minutes into a class completely wipes out the elapsed timer (`accumulatedElapsedSeconds = 0`), resets `startedAt`, and re-broadcasts `recording:started` to all students, desynchronizing recording UI state.
   - In contrast, `recording:pause` and `recording:resume` properly inspect `internal = roomRecordingStates.get(code)`.
   - Fix required: In `recording:start`, check `const existing = roomRecordingStates.get(code); if (existing && existing.isRecording) { ack?.({ ok: true, state: getRoomRecordingState(code), alreadyActive: true }); return; }`.

---

## 3. Caveats

- Hardware-accelerated browser WebRTC RTP media tracks over UDP ICE were not tested directly in Node.js runtime; these will be exercised end-to-end in Milestone 2 and Milestone 5.
- The Express body limit (`1mb`) remains configured for JSON; streaming uploads use raw binary content types which bypass JSON body parsing cleanly.

---

## 4. Conclusion

Milestone 1 shows solid foundations with verified bit-for-bit SHA-256 byte integrity, stream reassembly, and room isolation. However, **2 critical defects** must be resolved before Milestone 1 can be approved:

1. **Fix HTTP 206 Range clamping in `apps/api/src/services/recordings.ts`**: Clamp `end` to `fileSize - 1` if `end >= fileSize` rather than returning 416.
2. **Fix `recording:start` idempotency in `apps/api/src/realtime/socket.ts`**: Check if recording is already active; do not overwrite `startedAt` or reset `accumulatedElapsedSeconds` to 0, and return `alreadyActive: true`.

---

## 5. Verification Method

1. Run the empirical adversarial test suite:
   ```bash
   npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api -- recording-adversarial
   ```
   *Current state*: 18 passed, 2 failed.
   *Target state after Worker 1 fixes*: 20 passed (100%).

2. Run the full API Vitest test suite:
   ```bash
   npm test --prefix "E:\mnt\e\NexClass" -w @nexclass/api
   ```
   *Target state*: All test files pass (3 test files, 50 tests).
