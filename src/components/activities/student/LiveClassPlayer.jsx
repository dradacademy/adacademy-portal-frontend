import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X, Volume2, VolumeX } from "lucide-react";

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

// How often to ping our backend with live watch progress while playing —
// same cadence and same "actual play time, not just an open tab" principle
// as RecordedClassPlayer, so live attendance can't be gamed by leaving the
// page open without the stream actually running.
const PROGRESS_PING_INTERVAL_MS = 15000;

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
  const lastReportedTimeRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const pingIntervalRef = useRef(null);
  // Browsers block autoplay-with-sound (most mobile browsers included), so
  // the player starts muted below to guarantee it actually starts playing
  // — an unmuted autoplay request is silently ignored by the browser,
  // which otherwise leaves the video paused with no watch time ever
  // recorded and no error shown to the student. We immediately try an
  // in-script unMute() once playback begins (allowed, since the video is
  // already playing by then), and still expose this manual toggle as a
  // fallback for the rare browser that blocks even that.
  const [isMuted, setIsMuted] = useState(true);

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

  const sendProgress = (deltaSecondsWatched, newSession) => {
    if (deltaSecondsWatched <= 0 && !newSession) return;
    axios
      .post(
        `${import.meta.env.VITE_APP_API_URL}/live-classes/${liveClass._id}/progress`,
        { deltaSecondsWatched, newSession }
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
          // Starts muted so the browser actually allows the autoplay —
          // see the isMuted comment above.
          mute: 1,
        },
        events: {
          onStateChange: (event) => {
            const YT_STATE = window.YT.PlayerState;
            if (event.data === YT_STATE.PLAYING && !sessionStartedRef.current) {
              sessionStartedRef.current = true;
              sendProgress(0, true);
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

    attach();

    pingIntervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;
      // getCurrentTime() on a live broadcast only advances while it's
      // actually playing — that's what makes this a real watch-time signal
      // rather than "the page was open."
      const current = Math.floor(player.getCurrentTime() || 0);
      const delta = Math.max(0, current - lastReportedTimeRef.current);
      if (delta > 0) {
        lastReportedTimeRef.current = current;
        sendProgress(delta, false);
      }
    }, PROGRESS_PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pingIntervalRef.current);
      const player = playerRef.current;
      if (player && typeof player.getCurrentTime === "function") {
        const current = Math.floor(player.getCurrentTime() || 0);
        const delta = Math.max(0, current - lastReportedTimeRef.current);
        if (delta > 0) sendProgress(delta, false);
      }
      if (player && typeof player.destroy === "function") player.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId]);

  if (!youtubeVideoId && !error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          {loading ? "Joining live class…" : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl overflow-hidden w-full max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full p-1.5"
        >
          <X className="h-5 w-5" />
        </button>

        {!error && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-rose-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}

        {!error && youtubeVideoId && (
          <button
            onClick={() => {
              const player = playerRef.current;
              if (!player) return;
              if (isMuted) {
                player.unMute();
              } else {
                player.mute();
              }
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-white bg-black/60 hover:bg-black/80 rounded-full py-1.5 px-3 text-xs font-medium"
          >
            {isMuted ? (
              <>
                <VolumeX className="h-4 w-4" /> Tap to unmute
              </>
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        )}

        {error ? (
          <div className="aspect-video flex items-center justify-center text-white text-center p-8">
            {error}
          </div>
        ) : (
          <div className="aspect-video">
            <div ref={iframeContainerRef} className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassPlayer;
