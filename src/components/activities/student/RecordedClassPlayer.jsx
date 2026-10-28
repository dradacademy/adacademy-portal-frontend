import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createWatchTracker } from "../../../utils/watchTracker";
import { X, Maximize, Minimize, Play, RotateCcw } from "lucide-react";

const YOUTUBE_IFRAME_API_URL = "https://www.youtube.com/iframe_api";

let sdkLoadPromise = null;
const loadYoutubeIframeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    // YouTube's IFrame API calls this global callback itself once ready —
    // it doesn't fire a normal script "load" event we can rely on.
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


// Wraps a YouTube IFrame Player (fed a video ID the backend only hands over
// after checking category + active course enrollment — see
// videoPlaybackController.js) and reports watch-time back to our backend.
//
// Real, honest limitation: unlike the Cloudflare Stream approach this
// replaced, this is an ordinary YouTube embed once playback starts — there
// is no signed/expiring token and no true anti-download protection. The
// video is uploaded as Unlisted on YouTube (not publicly searchable), and
// the in-app enrollment/category check above is what controls who gets a
// video ID to watch in the first place — but a determined viewer with
// devtools or a screen recorder can't be fully stopped, same as any other
// web video embed.
const RecordedClassPlayer = ({ video, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [resumeOffered, setResumeOffered] = useState(false);
  // YouTube player state (-1 unstarted, 0 ended, 1 playing, 2 paused,
  // 3 buffering, 5 cued) — drives the covers below.
  const [playerState, setPlayerState] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Phones that can't put a <div> in real fullscreen (iPhone) get a
  // "fill the screen" mode instead.
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const wrapperRef = useRef(null);

  const iframeContainerRef = useRef(null);
  const playerRef = useRef(null);
  const sessionStartedRef = useRef(false);
  const trackerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAccess = async () => {
      try {
        setLoading(true);
        const [, accessResult] = await Promise.all([
          loadYoutubeIframeApi(),
          axios.get(
            `${import.meta.env.VITE_APP_API_URL}/videos/${video._id}/playback-token`
          ),
        ]);
        if (cancelled) return;
        setYoutubeVideoId(accessResult.data?.youtubeVideoId);
        setResumeOffered((video.lastPositionSeconds || 0) > 10);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Unable to start playback. Your enrollment may have expired."
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
  }, [video._id, video.lastPositionSeconds]);

  // Watch time is measured by createWatchTracker (real playing time + the
  // parts of the video actually played — seeks/resume jumps don't count).
  const sendProgress = (payload) => {
    axios
      .post(`${import.meta.env.VITE_APP_API_URL}/videos/${video._id}/progress`, payload)
      .catch(() => {
        // Best-effort — a dropped progress ping isn't worth surfacing to
        // the student mid-playback.
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
          rel: 0, // don't show related videos from other channels at the end
          modestbranding: 1,
          playsinline: 1,
          // YouTube's own fullscreen button is turned off: in YouTube's
          // fullscreen our covers (below) can't sit on top of the player,
          // so the YouTube logo would be clickable again. Our own
          // fullscreen button (bottom-right) fullscreens the whole box,
          // covers included.
          fs: 0,
          iv_load_policy: 3, // no annotations/cards
        },
        events: {
          onStateChange: (event) => {
            const YT_STATE = window.YT.PlayerState;
            if (event.data === YT_STATE.PLAYING && !sessionStartedRef.current) {
              sessionStartedRef.current = true;
              sendProgress({ v: 2, newSession: true });
            }
            trackerRef.current?.onStateChange(event.data);
            setPlayerState(event.data);
          },
        },
      });
    };

    trackerRef.current = createWatchTracker({
      getPlayer: () => playerRef.current,
      trackSegments: true,
      send: sendProgress,
    });
    trackerRef.current.start();

    attach();

    // Closing the tab/app or switching away: send what's been watched so far.
    const onHide = () => {
      if (document.visibilityState === "hidden") trackerRef.current?.flush();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onHide);
      // Final flush so a student who closes the player mid-video keeps the
      // last few seconds of watch credit.
      trackerRef.current?.stop();
      trackerRef.current = null;
      const player = playerRef.current;
      if (player && typeof player.destroy === "function") player.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId]);

  // ---- Keep students inside the app (2026-10-28) -----------------------
  // Students used to tap the YouTube logo / video title in the player,
  // which opens the video on YouTube (or the YouTube app) — watching there
  // is invisible to the app, so it never counted. Clear "covers" now sit on
  // top of those parts of the player so tapping them does nothing:
  //   - the title bar along the top,
  //   - the YouTube logo at the bottom-right (replaced by our fullscreen
  //     button),
  //   - the "More videos" / end-screen suggestions while paused or ended
  //     (replaced by our own Play / Watch again buttons).
  // Play/pause, the progress bar, volume, captions and speed still work.
  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!el && el === wrapperRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (isFullscreen) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }
      if (pseudoFullscreen) {
        setPseudoFullscreen(false);
        return;
      }
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else {
        setPseudoFullscreen(true);
        return;
      }
      try {
        await window.screen?.orientation?.lock?.("landscape");
      } catch {
        /* not allowed on this device — fine */
      }
    } catch {
      setPseudoFullscreen((v) => !v);
    }
  };

  const playFromCover = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playerState === 0 && typeof player.seekTo === "function") player.seekTo(0, true);
    if (typeof player.playVideo === "function") player.playVideo();
  };

  const swallow = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResume = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(video.lastPositionSeconds, true);
    }
    setResumeOffered(false);
  };

  if (!youtubeVideoId && !error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          {loading ? "Preparing playback…" : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        ref={wrapperRef}
        className={
          isFullscreen || pseudoFullscreen
            ? "bg-black flex items-center justify-center"
            : "bg-black rounded-2xl overflow-hidden w-full max-w-4xl relative"
        }
        style={
          pseudoFullscreen
            ? { position: "fixed", inset: 0, zIndex: 60, width: "100vw", height: "100vh" }
            : isFullscreen
              ? { width: "100%", height: "100%", position: "relative" }
              : undefined
        }
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>

        {error ? (
          <div className="aspect-video flex items-center justify-center text-white text-center p-8">
            {error}
          </div>
        ) : (
          <>
            <div
              className="relative"
              style={
                isFullscreen || pseudoFullscreen
                  ? { width: "100%", height: "100%", maxWidth: "177.78vh", maxHeight: "56.25vw", aspectRatio: "16 / 9" }
                  : { width: "100%", paddingTop: "56.25%" }
              }
            >
              <div style={{ position: "absolute", inset: 0 }}>
                <div ref={iframeContainerRef} className="w-full h-full" />
              </div>

              {/* Cover: title / channel bar at the top (links to YouTube). */}
              <div
                onClick={swallow}
                aria-hidden="true"
                style={{ position: "absolute", top: 0, left: 0, right: 0, height: 64, zIndex: 5, background: "transparent" }}
              />

              {/* Cover: paused / ended suggestions ("More videos"). The
                  control bar (bottom ~52px) stays usable. */}
              {(playerState === 2 || playerState === 0) && (
                <div
                  onClick={(e) => {
                    swallow(e);
                    playFromCover();
                  }}
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 52, zIndex: 6,
                    backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer",
                  }}
                >
                  <div className="flex flex-col items-center gap-2 text-white">
                    <span
                      className="rounded-full flex items-center justify-center"
                      style={{ width: 64, height: 64, backgroundColor: "#4f46e5" }}
                    >
                      {playerState === 0 ? <RotateCcw className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </span>
                    <span className="text-sm font-medium">
                      {playerState === 0 ? "Finished — watch again" : "Paused — tap to continue"}
                    </span>
                  </div>
                </div>
              )}

              {/* Cover: YouTube logo (bottom-right) → our fullscreen button. */}
              <button
                type="button"
                onClick={(e) => {
                  swallow(e);
                  toggleFullscreen();
                }}
                title={isFullscreen || pseudoFullscreen ? "Exit full screen" : "Full screen"}
                aria-label={isFullscreen || pseudoFullscreen ? "Exit full screen" : "Full screen"}
                className="flex items-center justify-center text-white"
                style={{
                  position: "absolute", right: 0, bottom: 0, width: 84, height: 48, zIndex: 7,
                  backgroundColor: "#0f0f0f",
                }}
              >
                {isFullscreen || pseudoFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>
            </div>
            {resumeOffered && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-3">
                Continue Watching — {Math.floor(video.lastPositionSeconds / 60)}:
                {String(video.lastPositionSeconds % 60).padStart(2, "0")}
                <button
                  onClick={handleResume}
                  className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded text-xs font-medium"
                >
                  Resume
                </button>
                <button
                  onClick={() => setResumeOffered(false)}
                  className="text-xs text-gray-300 hover:text-white"
                >
                  Start over
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecordedClassPlayer;
