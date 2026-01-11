import { getDB } from './db.js';

const INACTIVITY_THRESHOLD_MS = 5000;

let session = null;
let lastActionTs = null;
function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // fallback compatibile
  return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export const SessionTracker = {

  startSession({ profileId, subject, cognitiveArea, difficulty }) {
    session = {
      sessionId: uuid(),
      profileId,
      subject,
      cognitiveArea,
      difficulty,

      startTime: Date.now(),
      endTime: null,

      blocksStarted: 0,
      blocksCompleted: 0,

      answersTotal: 0,
      answersCorrect: 0,

      responseTimes: [],
      inactivityTimeSec: 0,

      errorsByCategory: {},
      events: []
    };

    lastActionTs = Date.now();
  },

  startBlock() {
    session.blocksStarted++;
    this._checkInactivity();
  },

  recordAnswer({ correct, responseTimeMs, errorCategory }) {
    this._checkInactivity();

    session.answersTotal++;
    if (correct) session.answersCorrect++;
    session.responseTimes.push(responseTimeMs);

    if (!correct && errorCategory) {
      session.errorsByCategory[errorCategory] =
        (session.errorsByCategory[errorCategory] || 0) + 1;
    }

    session.events.push({
      eventId: uuid(),
      sessionId: session.sessionId,
      type: 'answer',
      timestamp: Date.now(),
      correct,
      responseTimeMs,
      errorCategory
    });

    lastActionTs = Date.now();
  },

  endBlock() {
    session.blocksCompleted++;
    this._checkInactivity();
  },

  endSession() {
    session.endTime = Date.now();

    const durationSec =
      (session.endTime - session.startTime) / 1000;

    const avg = mean(session.responseTimes);
    const variance = varianceCalc(session.responseTimes, avg);

    const perseverance =
      session.blocksStarted === 0
        ? 0
        : session.blocksCompleted / session.blocksStarted;

    const summary = {
      sessionId: session.sessionId,
      profileId: session.profileId,

      startTime: session.startTime,
      endTime: session.endTime,
      durationSec,

      subject: session.subject,
      cognitiveArea: session.cognitiveArea,
      difficulty: session.difficulty,

      blocksStarted: session.blocksStarted,
      blocksCompleted: session.blocksCompleted,

      answersTotal: session.answersTotal,
      answersCorrect: session.answersCorrect,

      accuracy:
        session.answersTotal === 0
          ? 0
          : session.answersCorrect / session.answersTotal,

      avgResponseTimeMs: avg,
      responseTimeVariance: variance,

      inactivityTimeSec: session.inactivityTimeSec,

      errorsTotal: Object.values(session.errorsByCategory).reduce((a, b) => a + b, 0),
      errorsByCategory: session.errorsByCategory,

      perseveranceIndex: perseverance,

      createdAt: Date.now()
    };

    this._persist(summary, session.events);
    session = null;
  },

  _checkInactivity() {
    const now = Date.now();
    const delta = now - lastActionTs;

    if (delta > INACTIVITY_THRESHOLD_MS) {
      session.inactivityTimeSec += Math.floor(delta / 1000);
    }

    lastActionTs = now;
  },

  _persist(summary, events) {
    const db = getDB();
    const tx = db.transaction(['sessions', 'events'], 'readwrite');

    tx.objectStore('sessions').put(summary);

    const evStore = tx.objectStore('events');
    events.forEach(e => evStore.put(e));
  }
};

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function varianceCalc(arr, avg) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / arr.length;
}
