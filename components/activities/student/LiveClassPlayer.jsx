import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createWatchTracker } from "../../../utils/watchTracker";
import { X, Volume2, VolumeX, Maximize, Minimize, MessageCircle, Play } from "lucide-react";
import LiveQaPanel from "./LiveQaPanel";
import LiveAttendanceOverlay from "./LiveAttendanceOverlay";

const YOUTUBE_IFRAME_API_URL = "https://www.youtube.com/iframe_api";

let sdkLoadPromise = null;
const loadYoutubeIframeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") previousCallback();
      resolve();
    };

    const script = document.createElement("script");
    script.src = YOUTUBE_IFRAME_API_URL;
    script.async = true;
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
};


// Wraps a YouTube IFrame Player for a LIVE class (fed a video ID the
// backend only hands over after checking category + active course
// enrollment — see liveClassController.js's joinLiveClass). Unlike
// RecordedClassPlayer there's no fixed duration or "resume position" to
// track, but watch TIME is still reported — it's what powers automatic
// live attendance (see liveAttendanceModel.js / getLiveAttendanceReport).
const LiveClassPlayer = ({ liveClass, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);

  const iframeContainerRef = useRef(null);
  const playerRef = useRef(null);
  const sessionStartedRef = useRef(false);
  const trackerRef = useRef(null);
  // Browsers block autoplay-with-sound (most mobile browsers included), so
  // the player starts muted below to guarantee it actually starts playing
  // — an unmuted autoplay request is silently ignored by the browser,
  // which otherwise leaves the video paused with no watch time ever
  // recorded and no error shown to the student. We immediately try an
  // in-script unMute() once playback begins (allowed, since the video is
  // already playing by then), and still expose this manual toggle as a
  // fallback for the rare browser that blocks even that.
  const [isMuted, setIsMuted] = useState(true);

  // 2026-10-31 layout:
  //  - Nothing sits ON the video any more (the LIVE label, close and mute
  //    buttons moved to a bar above it), so the teacher's question at the
  //    top of the screen is never hidden — in normal or full screen.
  //  - The Q&A box is hidden; it opens by itself only while the teacher's
  //    question is open (or when the student taps "Q&A" to ask a doubt).
  //  - Attendance shows as a big blinking card on the video itself.
  //  - YouTube's own buttons/links are switched off and the video is
  //    covered by a see-through layer, so a tap can't open YouTube.
  const wrapperRef = useRef(null);
  const [board, setBoard] = useState(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [manualPanel, setManualPanel] = useState(false);
  const [dismissedPollId, setDismissedPollId] = useState(null);
  const [playerState, setPlayerState] = useState(-1);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [autoFill, setAutoFill] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchAccess = async () => {
      try {
        setLoading(true);
        const [, joinResult] = await Promise.all([
          loadYoutubeIframeApi(),
          axios.get(
            `${import.meta.env.VITE_APP_API_URL}/live-classes/${liveClass._id}/join`
          ),
        ]);
        if (cancelled) return;
        setYoutubeVideoId(joinResult.data?.youtubeVideoId);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Unable to join the live class. Your enrollment may have expired, or the class may have ended."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAccess();
    return () => {
      cancelled = true;
    };
  }, [liveClass._id]);

  // Real playing time only (createWatchTracker) — joining mid-stream no
  // longer counts the whole stream so far as watched.
  const sendProgress = (payload) => {
    axios
      .post(
        `${import.meta.env.VITE_APP_API_URL}/live-classes/${liveClass._id}/progress`,
        payload
      )
      .catch(() => {
        // Best-effort — a dropped progress ping isn't worth surfacing to
        // the student mid-class.
      });
  };

  useEffect(() => {
    if (!youtubeVideoId || !iframeContainerRef.current) return;

    let cancelled = false;

    const attach = async () => {
      await loadYoutubeIframeApi();
      if (cancelled || !iframeContainerRef.current) return;

      playerRef.current = new window.YT.Player(iframeContainerRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          autoplay: 1,
          // No YouTube buttons, logo link or full-screen button — those
          // are what took students out to the YouTube app (2026-10-31).
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          // Starts muted so the browser actually allows the autoplay —
          // see the isMuted comment above.
          mute: 1,
        },
        events: {
          onReady: () => setReady(true),
          onStateChange: (event) => {
            const YT_STATE = window.YT.PlayerState;
            setPlayerState(event.data);
            trackerRef.current?.onStateChange(event.data);
            if (event.data === YT_STATE.PLAYING && !sessionStartedRef.current) {
              sessionStartedRef.current = true;
              sendProgress({ v: 2, newSession: true });
              try {
                event.target.unMute();
                setIsMuted(event.target.isMuted());
              } catch (e) {
                // Some browsers still refuse this — the visible unmute
                // button below is the fallback.
              }
            }
          },
        },
      });
    };

    trackerRef.current = createWatchTracker({
      getPlayer: () => playerRef.current,
      trackSegments: false,
      send: sendProgress,
    });
    trackerRef.current.start();

    attach();

    const onHide = () => {
      if (document.visibilityState === "hidden") trackerRef.current?.flush();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onHide);
      trackerRef.current?.stop();
      trackerRef.current = null;
      const player = playerRef.current;
      if (player && typeof player.destroy === "function") player.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId]);

  // ----- full screen (same approach as the recorded-class player) -----
  const unlockOrientation = () => {
    try {
      window.screen?.orientation?.unlock?.();
    } catch {
      /* not supported */
    }
  };
  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!el && el === wrapperRef.current);
      if (!el) unlockOrientation();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  // Phone turned sideways = fill the screen (iPhone included).
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 600px)");
    const apply = () => setAutoFill(mq.matches);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else if (mq.addListener) mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else if (mq.removeListener) mq.removeListener(apply);
    };
  }, []);
  useEffect(
    () => () => {
      const el = document.fullscreenElement || document.webkitFullscreenElement;
      if (el && el === wrapperRef.current) {
        try {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } catch {
          /* ignore */
        }
      }
      unlockOrientation();
    },
    []
  );
  const full = isFullscreen || pseudoFullscreen || autoFill;
  const toggleFullscreen = async () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (isFullscreen) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch {
        /* ignore */
      }
      unlockOrientation();
      return;
    }
    if (pseudoFullscreen || autoFill) {
      setPseudoFullscreen(false);
      setAutoFill(false);
      return;
    }
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else {
        setPseudoFullscreen(true);
        return;
      }
    } catch {
      setPseudoFullscreen(true);
      return;
    }
    try {
      await window.screen?.orientation?.lock?.("landscape");
    } catch {
      /* the student can turn the phone */
    }
  };

  // ----- when to show the Q&A box -----
  const poll = board?.quiz?.currentPoll || null;
  const questionOpen = !!(poll && poll.open);
  const autoOpen = questionOpen && dismissedPollId !== poll._id;
  const showPanel = manualPanel || autoOpen;
  const closePanel = () => {
    setManualPanel(false);
    if (questionOpen) setDismissedPollId(poll._id);
  };

  const YT_PLAYING = 1;
  const YT_BUFFERING = 3;
  const needsTap = ready && playerState !== YT_PLAYING && playerState !== YT_BUFFERING;
  const playNow = () => {
    const player = playerRef.current;
    if (player && typeof player.playVideo === "function") player.playVideo();
  };
  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (isMuted) player.unMute();
    else player.mute();
    setIsMuted(!isMuted);
  };
  const swallow = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (!youtubeVideoId && !error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          {loading ? "Joining live class…" : null}
        </div>
      </div>
    );
  }

  const barBtn =
    "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 shrink-0";

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 sm:p-4">
      <div
        ref={wrapperRef}
        className={
          full
            ? "fixed inset-0 z-50 flex flex-col bg-black"
            : "w-full max-w-6xl max-h-full flex flex-col bg-black sm:rounded-2xl overflow-hidden"
        }
      >
        {/* Top bar — kept OFF the video so nothing covers the teacher's screen. */}
        <div className="flex items-center gap-2 px-2 sm:px-3 h-11 shrink-0" style={{ background: "#0a1e36" }}>
          <span className="flex items-center gap-1.5 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          <span className="text-white text-sm font-semibold truncate flex-1 min-w-0">{liveClass.title}</span>
          {!error && youtubeVideoId && (
            <button type="button" onClick={toggleMute} className={barBtn} aria-label={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {isMuted && <span className="hidden sm:inline">Tap to unmute</span>}
            </button>
          )}
          {!error && (
            <button
              type="button"
              onClick={() => (showPanel ? closePanel() : setManualPanel(true))}
              className={`${barBtn} relative`}
              aria-label="Questions and doubts"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{showPanel ? "Hide Q&A" : "Q&A"}</span>
              {questionOpen && !showPanel && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}
          {!error && (
            <button type="button" onClick={toggleFullscreen} className={barBtn} aria-label={full ? "Exit full screen" : "Full screen"}>
              {full ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span className="hidden sm:inline">{full ? "Exit" : "Full screen"}</span>
            </button>
          )}
          <button type="button" onClick={onClose} className={barBtn} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`flex min-h-0 ${full ? "flex-1 flex-row" : "flex-col lg:flex-row"}`}>
          <div className={`relative bg-black ${full ? "flex-1 min-w-0" : "w-full lg:flex-1"}`}>
            {error ? (
              <div className="aspect-video flex items-center justify-center text-white text-center p-8">{error}</div>
            ) : (
              <div className={full ? "absolute inset-0" : "aspect-video"}>
                <div ref={iframeContainerRef} className="w-full h-full" />
              </div>
            )}
            {!error && (
              <>
                {/* See-through cover: taps can't reach YouTube's links. */}
                <div
                  className="absolute inset-0 z-10"
                  onClick={(e) => {
                    swallow(e);
                    if (needsTap) playNow();
                  }}
                  onContextMenu={swallow}
                />
                {needsTap && (
                  <button
                    type="button"
                    onClick={playNow}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 rounded-full px-5 py-3 font-bold"
                    style={{ background: "#C9971F", color: "#0a1e36", boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}
                  >
                    <Play className="h-5 w-5" fill="#0a1e36" /> Tap to play
                  </button>
                )}
                <LiveAttendanceOverlay
                  att={board?.quiz?.attendance}
                  offsetMs={offsetMs}
                  onDone={() => setRefresh((n) => n + 1)}
                />
              </>
            )}
          </div>
          {!error && (
            <div
              className={
                showPanel
                  ? full
                    ? "w-[280px] sm:w-[340px] h-full shrink-0 min-h-0 border-l border-white/10"
                    : "w-full lg:w-[340px] h-[45vh] lg:h-auto lg:max-h-[75vh] min-h-0"
                  : "hidden"
              }
            >
              <LiveQaPanel
                liveClassId={liveClass._id}
                hideAttendance
                refresh={refresh}
                onBoard={(d, off) => {
                  setBoard(d);
                  setOffsetMs(off);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClassPlayer;
