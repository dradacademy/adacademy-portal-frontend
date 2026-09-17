import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

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

// How often to ping our backend with watch progress while playing. Kept
// fairly frequent (15s) so "Continue Watching" resumes close to where the
// student actually left off, without pinging on every single frame.
const PROGRESS_PING_INTERVAL_MS = 15000;

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

  const iframeContainerRef = useRef(null);
  const playerRef = useRef(null);
  const lastReportedTimeRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const pingIntervalRef = useRef(null);

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

  const sendProgress = (positionSeconds, deltaSecondsWatched, newSession) => {
    if (deltaSecondsWatched <= 0 && !newSession && positionSeconds == null) return;
    axios
      .post(`${import.meta.env.VITE_APP_API_URL}/videos/${video._id}/progress`, {
        positionSeconds,
        deltaSecondsWatched,
        newSession,
      })
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
        },
        events: {
          onStateChange: (event) => {
            const player = playerRef.current;
            if (!player) return;
            const YT_STATE = window.YT.PlayerState;

            if (event.data === YT_STATE.PLAYING && !sessionStartedRef.current) {
              sessionStartedRef.current = true;
              sendProgress(null, 0, true);
            }
            if (event.data === YT_STATE.PAUSED || event.data === YT_STATE.ENDED) {
              const current = Math.floor(player.getCurrentTime() || 0);
              const delta = Math.max(0, current - lastReportedTimeRef.current);
              lastReportedTimeRef.current = current;
              sendProgress(current, delta, false);
            }
          },
        },
      });
    };

    attach();

    pingIntervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;
      const current = Math.floor(player.getCurrentTime() || 0);
      const delta = Math.max(0, current - lastReportedTimeRef.current);
      if (delta > 0) {
        lastReportedTimeRef.current = current;
        sendProgress(current, delta, false);
      }
    }, PROGRESS_PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pingIntervalRef.current);
      const player = playerRef.current;
      if (player && typeof player.getCurrentTime === "function") {
        // Final progress flush on unmount so a student who navigates away
        // mid-video doesn't lose the last few seconds of watch credit.
        const current = Math.floor(player.getCurrentTime() || 0);
        const delta = Math.max(0, current - lastReportedTimeRef.current);
        if (delta > 0) sendProgress(current, delta, false);
      }
      if (player && typeof player.destroy === "function") player.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId]);

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
      <div className="bg-black rounded-2xl overflow-hidden w-full max-w-4xl relative">
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
            <div className="aspect-video">
              <div ref={iframeContainerRef} className="w-full h-full" />
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
