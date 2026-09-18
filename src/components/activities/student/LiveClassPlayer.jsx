import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

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
// enrollment — see liveClassController.js's joinLiveClass). Deliberately
// simpler than RecordedClassPlayer: a live stream has no fixed duration,
// no meaningful "resume position," and watch-time/percent-watched analytics
// don't apply the same way to a live broadcast, so none of that tracking
// runs here — this just embeds the stream once access is confirmed.
const LiveClassPlayer = ({ liveClass, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);

  const iframeContainerRef = useRef(null);
  const playerRef = useRef(null);

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
        },
      });
    };

    attach();

    return () => {
      cancelled = true;
      const player = playerRef.current;
      if (player && typeof player.destroy === "function") player.destroy();
      playerRef.current = null;
    };
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
