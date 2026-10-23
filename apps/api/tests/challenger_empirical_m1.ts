import { performance } from "node:perf_hooks";
import { createApp } from "../src/app";
import { MeetingModel, ParticipantModel } from "../src/models/index";
import {
  clearParticipantSockets,
  getParticipantSocket,
  getRoomRecordingState,
  participantSockets,
  registerMeetingHandlers,
  resetRoomRecordingStates,
  type MeetingSocket,
} from "../src/realtime/socket";

type FakeEmitRecord = { event: string; args: unknown[]; timestamp: number };

interface FakeSocketControl {
  socket: MeetingSocket;
  handlers: Map<string, Array<(...args: unknown[]) => Promise<unknown> | void>>;
  sent: FakeEmitRecord[];
  id: string;
}

function createFakeSocket(id: string, shared: Map<string, MeetingSocket>): FakeSocketControl {
  const handlers = new Map<string, Array<(...args: unknown[]) => Promise<unknown> | void>>();
  const sent: FakeEmitRecord[] = [];
  const track = (event: string, ...args: unknown[]) => sent.push({ event, args, timestamp: performance.now() });

  const socket: MeetingSocket = {
    data: {} as Record<string, unknown>,
    join: async (_room: string) => undefined,
    leave: async (_room: string) => undefined,
    emit: (event: string, payload?: unknown, ack?: (res: unknown) => void) => {
      track(event, payload);
      ack?.({ ok: true, payload });
    },
    to: (_room: string) => ({
      emit: (event: string, payload?: unknown) => track(event, payload),
    }),
    on: (event: string, handler: (...args: never[]) => void) => {
      const list = handlers.get(event) ?? [];
      list.push(handler as unknown as (...args: unknown[]) => Promise<unknown> | void);
      handlers.set(event, list);
    },
    server: { sockets: { sockets: shared } },
  };

  shared.set(id, socket);
  return { socket, handlers, sent, id };
}

async function fireEventAsync(ctrl: FakeSocketControl, event: string, ...args: unknown[]): Promise<void> {
  const list = ctrl.handlers.get(event) ?? [];
  for (const h of list) {
    const res = h(...args);
    if (res && typeof (res as Promise<unknown>).then === "function") {
      await res;
    }
  }
}

function findEvents(ctrl: FakeSocketControl, event: string, sinceTimestamp?: number): FakeEmitRecord[] {
  return ctrl.sent.filter((item) => item.event === event && (!sinceTimestamp || item.timestamp >= sinceTimestamp));
}

async function joinRoomAsync(
  ctrl: FakeSocketControl,
  meetingCode: string,
  name: string,
  role: "teacher" | "student" = "student",
): Promise<{ ok: boolean; participantId?: string }> {
  return new Promise((resolve) => {
    fireEventAsync(
      ctrl,
      "meeting:join",
      { meetingCode, name, language: "en" },
      (ack: { ok: boolean; participantId?: string }) => {
        resolve(ack);
      },
    );
  });
}

async function runEmpiricalChallenge() {
  console.log("================================================================================");
  console.log("CHALLENGER 2 EMPIRICAL TEST HARNESS - MILESTONE 1 (RECORDING & SIGNALING)");
  console.log("================================================================================\n");

  const results: Record<string, unknown> = {};

  // Initialize App / In-Memory Models
  createApp();

  /* ==========================================================================
   * TEST SUITE 1: participantSockets Map O(1) Performance Benchmark
   * ========================================================================== */
  console.log("--------------------------------------------------------------------------------");
  console.log("1. BENCHMARKING participantSockets Map O(1) vs Linear Scan");
  console.log("--------------------------------------------------------------------------------");

  const sampleSizes = [10, 50, 100, 500, 1000, 5000, 10000];
  const lookupIterations = 50000;
  const benchmarkResults: Array<{
    n: number;
    mapTotalMs: number;
    mapNsPerOp: number;
    linearTotalMs?: number;
    linearNsPerOp?: number;
    speedup?: number;
  }> = [];

  for (const n of sampleSizes) {
    clearParticipantSockets();
    const mockShared = new Map<string, MeetingSocket>();
    const testIds: string[] = [];

    for (let i = 0; i < n; i++) {
      const partId = `part_${n}_${i}`;
      testIds.push(partId);
      const fake = createFakeSocket(`sock_${n}_${i}`, mockShared);
      fake.socket.data.participantId = partId;
      participantSockets.set(partId, fake.socket);
    }

    // Pick target IDs at random for lookup
    const queryIds = Array.from({ length: lookupIterations }, () =>
      testIds[Math.floor(Math.random() * testIds.length)],
    );

    const dummyCaller = createFakeSocket("caller", mockShared).socket;

    // Benchmark O(1) Map lookup
    const t0 = performance.now();
    for (let i = 0; i < lookupIterations; i++) {
      getParticipantSocket(dummyCaller, queryIds[i]);
    }
    const t1 = performance.now();
    const mapTotalMs = t1 - t0;
    const mapNsPerOp = (mapTotalMs * 1e6) / lookupIterations;

    // Benchmark linear scan (for n <= 1000)
    let linearTotalMs: number | undefined;
    let linearNsPerOp: number | undefined;
    let speedup: number | undefined;

    if (n <= 1000) {
      const candidates = [...mockShared.values()];
      const tLinear0 = performance.now();
      for (let i = 0; i < 5000; i++) {
        const q = queryIds[i % queryIds.length];
        candidates.find((c) => c.data.participantId === q);
      }
      const tLinear1 = performance.now();
      linearTotalMs = ((tLinear1 - tLinear0) * lookupIterations) / 5000;
      linearNsPerOp = ((tLinear1 - tLinear0) * 1e6) / 5000;
      speedup = linearNsPerOp / mapNsPerOp;
    }

    benchmarkResults.push({
      n,
      mapTotalMs: Math.round(mapTotalMs * 100) / 100,
      mapNsPerOp: Math.round(mapNsPerOp * 10) / 10,
      linearTotalMs: linearTotalMs ? Math.round(linearTotalMs * 100) / 100 : undefined,
      linearNsPerOp: linearNsPerOp ? Math.round(linearNsPerOp * 10) / 10 : undefined,
      speedup: speedup ? Math.round(speedup * 10) / 10 : undefined,
    });
  }

  console.table(benchmarkResults);
  results.mapBenchmark = benchmarkResults;

  const latency10 = benchmarkResults.find((r) => r.n === 10)!.mapNsPerOp;
  const latency10k = benchmarkResults.find((r) => r.n === 10000)!.mapNsPerOp;
  console.log(`Map lookup latency: N=10 -> ${latency10} ns/op, N=10,000 -> ${latency10k} ns/op`);
  const isO1 = latency10k < latency10 * 3.5;
  console.log(`Map lookup complexity is strictly O(1): ${isO1 ? "PASS" : "FAIL"}`);

  // Test WebRTC signaling relay throughput
  console.log("\nTesting WebRTC signaling packet relay throughput via getParticipantSocket...");
  clearParticipantSockets();
  const signalingShared = new Map<string, MeetingSocket>();
  const peerA = createFakeSocket("peer-A", signalingShared);
  peerA.socket.data.participantId = "part-A";
  participantSockets.set("part-A", peerA.socket);

  const peerB = createFakeSocket("peer-B", signalingShared);
  peerB.socket.data.participantId = "part-B";
  participantSockets.set("part-B", peerB.socket);

  registerMeetingHandlers(peerA.socket, {
    userId: "user-A",
    participantId: "part-A",
    name: "Peer A",
    role: "teacher",
    meetingCode: "RELAY01",
  });
  registerMeetingHandlers(peerB.socket, {
    userId: "user-B",
    participantId: "part-B",
    name: "Peer B",
    role: "student",
    meetingCode: "RELAY01",
  });

  const packetCount = 10000;
  const relayStart = performance.now();
  for (let i = 0; i < packetCount; i++) {
    peerA.handlers.get("webrtc:ice")?.[0]?.({
      toId: "part-B",
      candidate: { candidate: `candidate:${i}`, sdpMLineIndex: 0 },
    });
  }
  const relayDuration = performance.now() - relayStart;
  const relayedEvents = findEvents(peerB, "webrtc:ice");
  const relayRate = Math.round((packetCount / relayDuration) * 1000);
  console.log(`Relayed ${relayedEvents.length} / ${packetCount} WebRTC ICE packets in ${Math.round(relayDuration)}ms (${relayRate} packets/sec)`);
  const relayPass = relayedEvents.length === packetCount;
  console.log(`Signaling relay throughput test: ${relayPass ? "PASS" : "FAIL"}`);
  results.signalingRelay = { packetCount, relayed: relayedEvents.length, durationMs: relayDuration, ratePerSec: relayRate };

  /* ==========================================================================
   * TEST SUITE 2: Socket Lifecycle & Leak Stress Test
   * ========================================================================== */
  console.log("\n--------------------------------------------------------------------------------");
  console.log("2. STRESS TESTING Socket Lifecycle Cleanup & Memory Leaks");
  console.log("--------------------------------------------------------------------------------");

  clearParticipantSockets();
  resetRoomRecordingStates();

  const lifecycleCode = "STRESS_LIFE";
  await MeetingModel.create({
    code: lifecycleCode,
    title: "Lifecycle Meeting",
    hostId: "teacher_life",
    speakerLanguage: "en",
    status: "live",
  });

  const concurrentCount = 100;
  const lifecycleShared = new Map<string, MeetingSocket>();
  const sockets: FakeSocketControl[] = [];

  console.log(`Simulating ${concurrentCount} concurrent joins...`);
  const joinPromises: Promise<{ ok: boolean; participantId?: string }>[] = [];

  for (let i = 0; i < concurrentCount; i++) {
    const sock = createFakeSocket(`sock_life_${i}`, lifecycleShared);
    sockets.push(sock);

    registerMeetingHandlers(sock.socket, {
      userId: `user_life_${i}`,
      participantId: null, // let resolveParticipant assign ID
      name: `User ${i}`,
      role: i === 0 ? "teacher" : "student",
      meetingCode: null,
    });

    joinPromises.push(joinRoomAsync(sock, lifecycleCode, `User ${i}`, i === 0 ? "teacher" : "student"));
  }

  const joinResults = await Promise.all(joinPromises);
  const allJoinedOk = joinResults.every((r) => r.ok && r.participantId);
  console.log(`All ${concurrentCount} joins acknowledged: ${allJoinedOk ? "PASS" : "FAIL"}`);

  const initialSize = participantSockets.size;
  console.log(`participantSockets.size after ${concurrentCount} joins: ${initialSize} (expected ${concurrentCount})`);

  // Test 50 participants leaving gracefully via "meeting:leave"
  console.log("Simulating 50 participants leaving gracefully via 'meeting:leave'...");
  for (let i = 0; i < 50; i++) {
    await fireEventAsync(sockets[i], "meeting:leave");
  }
  const sizeAfterLeave = participantSockets.size;
  console.log(`participantSockets.size after 50 'meeting:leave': ${sizeAfterLeave} (expected 50)`);

  // Test remaining 50 participants disconnecting abruptly via "disconnect"
  console.log("Simulating remaining 50 participants disconnecting abruptly via 'disconnect'...");
  for (let i = 50; i < 100; i++) {
    await fireEventAsync(sockets[i], "disconnect");
  }
  const sizeAfterDisconnect = participantSockets.size;
  console.log(`participantSockets.size after remaining 50 'disconnect': ${sizeAfterDisconnect} (expected 0)`);

  results.lifecycleCleanup = {
    joins: concurrentCount,
    allJoinedOk,
    sizeAfterJoins: initialSize,
    sizeAfter50Leaves: sizeAfterLeave,
    sizeAfterRemaining50Disconnects: sizeAfterDisconnect,
  };

  /* Edge Case 2A: Double left notification when meeting:leave followed by disconnect */
  console.log("\nTesting Edge Case: Client calls 'meeting:leave' followed by 'disconnect'...");
  clearParticipantSockets();
  const testDoubleLeaveShared = new Map<string, MeetingSocket>();
  const watcher = createFakeSocket("sock_watcher", testDoubleLeaveShared);
  const leaver = createFakeSocket("sock_leaver", testDoubleLeaveShared);

  registerMeetingHandlers(watcher.socket, {
    userId: "user_watcher",
    participantId: null,
    name: "Watcher",
    role: "student",
    meetingCode: null,
  });
  registerMeetingHandlers(leaver.socket, {
    userId: "user_leaver",
    participantId: null,
    name: "Leaver",
    role: "student",
    meetingCode: null,
  });

  await joinRoomAsync(watcher, lifecycleCode, "Watcher");
  const leaverJoined = await joinRoomAsync(leaver, lifecycleCode, "Leaver");
  const leaverPartId = leaverJoined.participantId!;

  await fireEventAsync(leaver, "meeting:leave");
  await fireEventAsync(leaver, "disconnect");

  const leftEvents = findEvents(watcher, "participant:left");
  console.log(`Watcher received ${leftEvents.length} 'participant:left' events (expected 1, got ${leftEvents.length})`);
  const doubleLeftAnomaly = leftEvents.length > 1;
  if (doubleLeftAnomaly) {
    console.warn("⚠️ ANOMALY CONFIRMED: Calling disconnect after meeting:leave emits a redundant duplicate 'participant:left' event!");
  }
  results.doubleLeftAnomaly = { leftEventCount: leftEvents.length, redundant: doubleLeftAnomaly };

  /* Edge Case 2B: Rapid Reconnect / Socket Replacement */
  console.log("\nTesting Edge Case: Rapid Reconnect (Socket A replaced by Socket B for same user, then Socket A disconnects)...");
  clearParticipantSockets();
  const reconnectShared = new Map<string, MeetingSocket>();
  const sockA = createFakeSocket("sock_A", reconnectShared);
  const sockB = createFakeSocket("sock_B", reconnectShared);
  const observer = createFakeSocket("sock_obs", reconnectShared);

  const sharedUserId = "user_reconnect_test";

  registerMeetingHandlers(observer.socket, {
    userId: "user_obs",
    participantId: null,
    name: "Observer",
    role: "teacher",
    meetingCode: null,
  });
  registerMeetingHandlers(sockA.socket, {
    userId: sharedUserId,
    participantId: null,
    name: "Reconnecting User",
    role: "student",
    meetingCode: null,
  });
  registerMeetingHandlers(sockB.socket, {
    userId: sharedUserId,
    participantId: null,
    name: "Reconnecting User",
    role: "student",
    meetingCode: null,
  });

  await joinRoomAsync(observer, lifecycleCode, "Observer", "teacher");
  const joinA = await joinRoomAsync(sockA, lifecycleCode, "Reconnecting User");
  const targetPartId = joinA.participantId!;
  console.log("Socket A joined. participantId:", targetPartId, "Map holds sockA:", participantSockets.get(targetPartId) === sockA.socket);

  // Now user reconnects with Socket B (same userId, resolves to same participant)
  const joinB = await joinRoomAsync(sockB, lifecycleCode, "Reconnecting User");
  console.log("Socket B joined. participantId:", joinB.participantId, "Map holds sockB:", participantSockets.get(targetPartId) === sockB.socket);

  // Now old Socket A disconnects
  await fireEventAsync(sockA, "disconnect");

  const socketStillB = participantSockets.get(targetPartId) === sockB.socket;
  console.log("After Socket A disconnect, participantSockets still holds Socket B:", socketStillB);

  // Check if observer received participant:left from the stale Socket A
  const obsLeftEvents = findEvents(observer, "participant:left");
  console.log(`Observer received 'participant:left' from Socket A disconnect while Socket B is still active: ${obsLeftEvents.length > 0}`);
  if (obsLeftEvents.length > 0) {
    console.warn("⚠️ EDGE-CASE BEHAVIOR: Old socket disconnect emits 'participant:left' to the room even when the participant has already reconnected on another socket.");
  }
  results.reconnectSafety = {
    retainedSocketB: socketStillB,
    prematureLeftBroadcast: obsLeftEvents.length > 0,
  };

  /* High-Churn Memory / Cleanup Cycle */
  console.log("\nTesting High-Churn Cycles (1,000 connect -> join -> leave -> disconnect)...");
  clearParticipantSockets();
  const churnShared = new Map<string, MeetingSocket>();
  const initialHeap = process.memoryUsage().heapUsed;

  for (let c = 0; c < 1000; c++) {
    const s = createFakeSocket(`sock_churn_${c}`, churnShared);
    registerMeetingHandlers(s.socket, {
      userId: `user_churn_${c}`,
      participantId: null,
      name: `Churn ${c}`,
      role: "student",
      meetingCode: null,
    });
    await joinRoomAsync(s, lifecycleCode, `Churn ${c}`);
    await fireEventAsync(s, "meeting:leave");
    await fireEventAsync(s, "disconnect");
    churnShared.delete(`sock_churn_${c}`);
  }

  const finalHeap = process.memoryUsage().heapUsed;
  const leakFinalSize = participantSockets.size;
  console.log(`participantSockets.size after 1,000 churn cycles: ${leakFinalSize} (expected 0)`);
  console.log(`Heap delta after 1,000 churn cycles: ${Math.round((finalHeap - initialHeap) / 1024)} KB`);
  results.churnTest = {
    cycles: 1000,
    finalMapSize: leakFinalSize,
    heapDeltaKb: Math.round((finalHeap - initialHeap) / 1024),
  };

  /* ==========================================================================
   * TEST SUITE 3: Broadcast Fanout & Multi-Room Isolation Test
   * ========================================================================== */
  console.log("\n--------------------------------------------------------------------------------");
  console.log("3. TESTING Broadcast Fanout & Multi-Room Isolation");
  console.log("--------------------------------------------------------------------------------");

  clearParticipantSockets();
  resetRoomRecordingStates();

  const roomACode = "ROOM_ALPHA";
  const roomBCode = "ROOM_BETA";

  await MeetingModel.create({
    code: roomACode,
    title: "Room Alpha",
    hostId: "teacher_alpha",
    speakerLanguage: "en",
    status: "live",
  });

  await MeetingModel.create({
    code: roomBCode,
    title: "Room Beta",
    hostId: "teacher_beta",
    speakerLanguage: "en",
    status: "live",
  });

  const broadcastShared = new Map<string, MeetingSocket>();
  const roomAParticipants: FakeSocketControl[] = [];
  const roomBParticipants: FakeSocketControl[] = [];

  const participantsPerRoom = 15;

  // Join Room A (Host + 14 students)
  for (let i = 0; i < participantsPerRoom; i++) {
    const s = createFakeSocket(`sock_A_${i}`, broadcastShared);
    roomAParticipants.push(s);
    registerMeetingHandlers(s.socket, {
      userId: `user_A_${i}`,
      participantId: null,
      name: i === 0 ? "Teacher Alpha" : `Student A-${i}`,
      role: i === 0 ? "teacher" : "student",
      meetingCode: null,
    });
    await joinRoomAsync(s, roomACode, i === 0 ? "Teacher Alpha" : `Student A-${i}`, i === 0 ? "teacher" : "student");
  }

  // Join Room B (Host + 14 students)
  for (let i = 0; i < participantsPerRoom; i++) {
    const s = createFakeSocket(`sock_B_${i}`, broadcastShared);
    roomBParticipants.push(s);
    registerMeetingHandlers(s.socket, {
      userId: `user_B_${i}`,
      participantId: null,
      name: i === 0 ? "Teacher Beta" : `Student B-${i}`,
      role: i === 0 ? "teacher" : "student",
      meetingCode: null,
    });
    await joinRoomAsync(s, roomBCode, i === 0 ? "Teacher Beta" : `Student B-${i}`, i === 0 ? "teacher" : "student");
  }

  console.log(`Room A joined with ${roomAParticipants.length} participants.`);
  console.log(`Room B joined with ${roomBParticipants.length} participants.`);
  console.log(`Total server sockets: ${broadcastShared.size}`);

  const teacherA = roomAParticipants[0];

  // Record baseline timestamp before firing Room A recording events
  const recordingOpStartTimestamp = performance.now();

  // 1. START RECORDING IN ROOM A
  console.log("\nStep 3.1: Starting recording in Room A...");
  const tBroadcastStart = performance.now();
  await fireEventAsync(teacherA, "recording:start", { meetingCode: roomACode });
  const tBroadcastDuration = performance.now() - tBroadcastStart;

  // Verify all Room A participants received recording:state (isRecording: true)
  const roomARecStateCount = roomAParticipants.filter((p) => {
    const events = findEvents(p, "recording:state", recordingOpStartTimestamp);
    const last = events[events.length - 1];
    return last && (last.args[0] as { isRecording: boolean }).isRecording === true;
  }).length;

  const roomARecStartedCount = roomAParticipants.filter(
    (p) => findEvents(p, "recording:started", recordingOpStartTimestamp).length > 0,
  ).length;

  console.log(`Room A: ${roomARecStateCount} / ${participantsPerRoom} participants received recording:state (isRecording=true)`);
  console.log(`Room A: ${roomARecStartedCount} / ${participantsPerRoom} participants received recording:started`);

  // Verify Room B received ZERO recording events after Room A started
  const roomBRecEvents = roomBParticipants.reduce((sum, p) => {
    return sum + findEvents(p, "recording:state", recordingOpStartTimestamp).length + findEvents(p, "recording:started", recordingOpStartTimestamp).length;
  }, 0);
  console.log(`Room B: received ${roomBRecEvents} recording events from Room A (expected 0)`);
  const isolationPass = roomBRecEvents === 0;
  console.log(`Multi-room recording broadcast isolation: ${isolationPass ? "PASS" : "FAIL"}`);

  // 2. PAUSE RECORDING IN ROOM A
  console.log("\nStep 3.2: Pausing recording in Room A...");
  const pauseTimestamp = performance.now();
  await fireEventAsync(teacherA, "recording:pause", { meetingCode: roomACode });
  const roomAPauseCount = roomAParticipants.filter((p) => {
    const events = findEvents(p, "recording:state", pauseTimestamp);
    const last = events[events.length - 1];
    return last && (last.args[0] as { isRecording: boolean; isPaused: boolean }).isPaused === true;
  }).length;
  console.log(`Room A: ${roomAPauseCount} / ${participantsPerRoom} participants received recording:state (isPaused=true)`);

  // 3. RESUME RECORDING IN ROOM A
  console.log("\nStep 3.3: Resuming recording in Room A...");
  const resumeTimestamp = performance.now();
  await fireEventAsync(teacherA, "recording:resume", { meetingCode: roomACode });
  const roomAResumeCount = roomAParticipants.filter((p) => {
    const events = findEvents(p, "recording:state", resumeTimestamp);
    const last = events[events.length - 1];
    const state = last?.args[0] as { isRecording: boolean; isPaused: boolean };
    return state && state.isRecording === true && state.isPaused === false;
  }).length;
  console.log(`Room A: ${roomAResumeCount} / ${participantsPerRoom} participants received recording:state (isPaused=false)`);

  // 4. LATE JOINER TEST IN ROOM A
  console.log("\nStep 3.4: Late joiner synchronization during active recording...");
  await new Promise((r) => setTimeout(r, 1100)); // wait >1s for elapsed time

  const lateJoiner = createFakeSocket("sock_A_late", broadcastShared);
  registerMeetingHandlers(lateJoiner.socket, {
    userId: "user_A_late",
    participantId: null,
    name: "Late Joiner",
    role: "student",
    meetingCode: null,
  });

  await joinRoomAsync(lateJoiner, roomACode, "Late Joiner");
  const joinedEvents = findEvents(lateJoiner, "meeting:joined");
  const lateJoinedPayload = joinedEvents.length > 0
    ? (joinedEvents[0].args[0] as { recordingState?: { isRecording: boolean; elapsedSeconds: number } })
    : null;
  const lateRecEvents = findEvents(lateJoiner, "recording:state");
  const lateState = lateRecEvents[lateRecEvents.length - 1]?.args[0] as { isRecording: boolean; elapsedSeconds: number } | undefined;

  console.log("Late joiner meeting:joined recordingState:", lateJoinedPayload?.recordingState);
  console.log("Late joiner recording:state event:", lateState);

  const lateSyncPass =
    Boolean(lateState?.isRecording) === true &&
    (lateState?.elapsedSeconds ?? 0) >= 1 &&
    Boolean(lateJoinedPayload?.recordingState?.isRecording) === true;
  console.log(`Late joiner synchronization test: ${lateSyncPass ? "PASS" : "FAIL"}`);

  // 5. STOP RECORDING IN ROOM A
  console.log("\nStep 3.5: Stopping recording in Room A...");
  const stopTimestamp = performance.now();
  await fireEventAsync(teacherA, "recording:stop", { meetingCode: roomACode });
  const roomAStopCount = roomAParticipants.filter((p) => {
    const events = findEvents(p, "recording:state", stopTimestamp);
    const last = events[events.length - 1];
    const state = last?.args[0] as { isRecording: boolean };
    return state && state.isRecording === false;
  }).length;
  console.log(`Room A: ${roomAStopCount} / ${participantsPerRoom} participants received recording:state (isRecording=false)`);

  results.fanoutAndIsolation = {
    roomAParticipants: participantsPerRoom,
    roomBParticipants: participantsPerRoom,
    startBroadcastFanoutReceived: roomARecStateCount,
    pauseFanoutReceived: roomAPauseCount,
    resumeFanoutReceived: roomAResumeCount,
    stopFanoutReceived: roomAStopCount,
    roomBIsolationLeakCount: roomBRecEvents,
    lateJoinerSynchronized: lateSyncPass,
    fanoutDurationMs: Math.round(tBroadcastDuration * 100) / 100,
  };

  /* Fanout Scaling Test */
  console.log("\nStep 3.6: Broadcast fanout scaling test (200 sockets in room)...");
  const scaleRoomCode = "ROOM_SCALE_200";
  await MeetingModel.create({
    code: scaleRoomCode,
    title: "Scale Meeting 200",
    hostId: "teacher_scale",
    speakerLanguage: "en",
    status: "live",
  });

  const scaleShared = new Map<string, MeetingSocket>();
  const scaleSockets: FakeSocketControl[] = [];
  const scaleN = 200;

  for (let i = 0; i < scaleN; i++) {
    const s = createFakeSocket(`sock_scale_${i}`, scaleShared);
    scaleSockets.push(s);
    registerMeetingHandlers(s.socket, {
      userId: `user_scale_${i}`,
      participantId: null,
      name: `Scale ${i}`,
      role: i === 0 ? "teacher" : "student",
      meetingCode: null,
    });
    await joinRoomAsync(s, scaleRoomCode, `Scale ${i}`, i === 0 ? "teacher" : "student");
  }

  const scaleStartTimestamp = performance.now();
  await fireEventAsync(scaleSockets[0], "recording:start", { meetingCode: scaleRoomCode });
  const fanout200Ms = performance.now() - scaleStartTimestamp;

  const recStateCount200 = scaleSockets.filter(
    (s) => findEvents(s, "recording:state", scaleStartTimestamp).length > 0,
  ).length;
  console.log(`Fanout to ${scaleN} sockets completed in ${Math.round(fanout200Ms * 100) / 100}ms (${recStateCount200}/${scaleN} received)`);
  results.fanoutScaling = { n: scaleN, durationMs: Math.round(fanout200Ms * 100) / 100, receivedCount: recStateCount200 };

  console.log("\n================================================================================");
  console.log("FINAL SUMMARY & VERDICT EVALUATION");
  console.log("================================================================================");
  console.log(JSON.stringify(results, null, 2));

  return results;
}

runEmpiricalChallenge()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test harness failed with error:", err);
    process.exit(1);
  });
