import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const STREAM_SDK_URL = "https://embed.cloudflarestream.com/embed/sdk.latest.js";

let sdkLoadPromise = null;
const loadStreamSdk = () => {
  if (window.Stream) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = STREAM_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cloudflare Stream player script."));
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
};

// How often to ping our backend with watch progress while playing. Kept
// fairly frequent (15s) so "Continue Watching" resumes close to where the
// student actually left off, without pinging on every single frame.
const PROGRESS_PING_INTERVAL_MS = 15000;

// Wraps Cloudflare's Stream Player (fed a short-lived signed token — never
// a raw file URL) and reports watch-time back to our backend. The iframe
// itself has no download affordance and serves HLS-only — that, plus the
// enrollment/category check already done to obtain the token, is what
// satisfies "students can only stream, never download" as far as this
// player's own UI goes (screen recording can never be fully prevented by
// any web player, which is expected and out of scope here).
const RecordedClassPlayer = ({ video, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackInfo, setPlaybackInfo] = useState(null);
  const [resumeOffered, setResumeOffered] = useState(false);

  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const lastReportedTimeRef = useRef(0);
  const sessionStartedRef = useRef(false);
  const pingIntervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchToken = async () => {
      try {
        setLoading(true);
        const [sdkResult, tokenResult] = await Promise.all([
          loadStreamSdk(),
          axios.get(
            `${import.meta.env.VITE_APP_API_URL}/videos/${video._id}/playback-token`
          ),
        ]);
        if (cancelled) return;
        setPlaybackInfo(tokenResult.data);
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

    fetchToken();
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
    if (!playbackInfo || !iframeRef.current) return;

    let player;
    let onPlay;
    let onPause;
    let onEnded;

    const attach = async () => {
      await loadStreamSdk();
      player = window.Stream(iframeRef.current);
      playerRef.current = player;

      onPlay = () => {
        if (!sessionStartedRef.current) {
          sessionStartedRef.current = true;
          sendProgress(null, 0, true);
        }
      };
      onPause = () => {
        const current = Math.floor(player.currentTime || 0);
        const delta = Math.max(0, current - lastReportedTimeRef.current);
        lastReportedTimeRef.current = current;
        sendProgress(current, delta, false);
      };
      onEnded = onPause;

      player.addEventListener("play", onPlay);
      player.addEventListener("pause", onPause);
      player.addEventListener("ended", onEnded);
    };

    attach();

    pingIntervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      const current = Math.floor(playerRef.current.currentTime || 0);
      const delta = Math.max(0, current - lastReportedTimeRef.current);
      if (delta > 0) {
        lastReportedTimeRef.current = current;
        sendProgress(current, delta, false);
      }
    }, PROGRESS_PING_INTERVAL_MS);

    return () => {
      clearInterval(pingIntervalRef.current);
      if (player) {
        if (onPlay) player.removeEventListener("play", onPlay);
        if (onPause) player.removeEventListener("pause", onPause);
        if (onEnded) player.removeEventListener("ended", onEnded);
        // Final progress flush on unmount so a student who navigates away
        // mid-video doesn't lose the last few seconds of watch credit.
        const current = Math.floor(player.currentTime || 0);
        const delta = Math.max(0, current - lastReportedTimeRef.current);
        if (delta > 0) sendProgress(current, delta, false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackInfo]);

  const handleResume = () => {
    if (playerRef.current) {
      playerRef.current.currentTime = video.lastPositionSeconds;
    }
    setResumeOffered(false);
  };

  if (!playbackInfo && !error) {
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
              <iframe
                ref={iframeRef}
                id={`stream-player-${video._id}`}
                title={video.title}
                src={`https://customer-${playbackInfo.customerCode}.cloudflarestream.com/${playbackInfo.signedToken}/iframe?controls=true`}
                style={{ border: "none", width: "100%", height: "100%" }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
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
