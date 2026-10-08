// Measures what a student ACTUALLY watched in a YouTube player — shared by
// RecordedClassPlayer and LiveClassPlayer. (Fixed 2026-10-08.)
//
// The old code reported "how far the play position moved" since the last
// report. Resuming at 2:00:00 or dragging the progress bar forward was
// counted as hours watched, which is why some 150-minute classes showed
// 10-17h of watch time. This tracker instead reports:
//   playedSeconds - real clock time while the player was actually PLAYING
//                   (paused, buffering or closed time is not counted);
//   segments      - [start, end] parts of the video played normally. A jump
//                   bigger than real elapsed time x playback speed is a
//                   seek/resume and is NOT counted as watched.
// The backend merges segments, so rewatching the same part never pushes
// "% watched" past what was really covered (see backend utils/watchTime.js).

const SAMPLE_MS = 2000; // check the player every 2s
const FLUSH_MS = 15000; // send to the server every 15s
// A background tab's timers can be slowed to about once a minute; cap one
// sample a bit above that so a laptop waking from sleep can't add hours.
const MAX_WALL_PER_SAMPLE_S = 75;
const SEEK_TOLERANCE_S = 3;

export const createWatchTracker = ({ getPlayer, trackSegments, send }) => {
  let playing = false;
  let lastWall = 0;
  let lastPos = null;
  let played = 0;
  let segments = [];
  let timer = null;
  let lastFlush = Date.now();

  const position = () => {
    try {
      const t = getPlayer()?.getCurrentTime?.();
      return typeof t === "number" && Number.isFinite(t) ? t : null;
    } catch {
      return null;
    }
  };

  const speed = () => {
    try {
      const r = getPlayer()?.getPlaybackRate?.();
      return typeof r === "number" && r > 0 ? r : 1;
    } catch {
      return 1;
    }
  };

  const addSegment = (start, end) => {
    const last = segments[segments.length - 1];
    if (last && Math.abs(last[1] - start) < 0.5) last[1] = end;
    else segments.push([start, end]);
  };

  const sample = () => {
    if (!playing) return;
    const now = Date.now();
    const wall = Math.min(MAX_WALL_PER_SAMPLE_S, (now - lastWall) / 1000);
    lastWall = now;
    if (wall <= 0) return;
    played += wall;

    if (trackSegments) {
      const pos = position();
      if (pos != null && lastPos != null) {
        const advanced = pos - lastPos;
        // Normal playback moves at most (real time x speed). Anything more
        // is a seek/resume jump; going backwards is a rewind. Neither is
        // counted — tracking simply continues from the new position.
        if (advanced > 0 && advanced <= wall * speed() + SEEK_TOLERANCE_S) {
          addSegment(lastPos, pos);
        }
      }
      lastPos = pos;
    }
  };

  const flush = () => {
    sample();
    if (played < 0.5 && segments.length === 0) return;
    const pos = position();
    send({
      v: 2,
      playedSeconds: Math.round(played * 10) / 10,
      segments: trackSegments
        ? segments.map(([s, e]) => [Math.round(s * 10) / 10, Math.round(e * 10) / 10])
        : undefined,
      positionSeconds: trackSegments && pos != null ? Math.floor(pos) : undefined,
    });
    played = 0;
    segments = [];
    lastFlush = Date.now();
  };

  return {
    start() {
      if (timer) return;
      timer = setInterval(() => {
        sample();
        if (Date.now() - lastFlush >= FLUSH_MS) flush();
      }, SAMPLE_MS);
    },
    // Call with the YouTube player state on every onStateChange.
    onStateChange(state) {
      const YT = window.YT?.PlayerState;
      if (!YT) return;
      if (state === YT.PLAYING) {
        if (!playing) {
          playing = true;
          lastWall = Date.now();
          lastPos = position();
        }
      } else if (state === YT.PAUSED || state === YT.ENDED || state === YT.BUFFERING) {
        sample();
        playing = false;
        flush();
      }
    },
    flush,
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      sample();
      playing = false;
      flush();
    },
  };
};
