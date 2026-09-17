import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import RecordedClassPlayer from "../../../components/activities/student/RecordedClassPlayer";
import { Video, PlayCircle, Lock } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
};

// Student-facing recorded-class library — in-app streaming only (no
// download, no direct file access). Gated by course-enrollment validity on
// the backend (videoPlaybackController.js); this page just reflects that
// state (enrollmentActive per video) so a student with a lapsed enrollment
// sees why they can't press play instead of a generic error.
const RecordedClassesStudent = () => {
  const { userData } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/videos/available`
      );
      setVideos(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load recorded classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?._id) fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleClosePlayer = () => {
    setPlayingVideo(null);
    // Refresh so the list reflects updated watch progress/percentage.
    fetchVideos();
  };

  return (
    <div className="p-5">
      <Navbar />
      <main className="mx-auto px-4 py-8 w-full max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Recorded Classes
          </h1>
          <p className="text-gray-600 mt-1">
            Stream your recorded classes anytime — view only, no downloads.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-500 py-16">{error}</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-gray-400 py-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center gap-2">
            <Video className="h-8 w-8 text-gray-300" />
            No recorded classes are available for your course yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video) => (
              <div
                key={video._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                  <Video className="h-10 w-10 text-indigo-300" />
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-semibold text-gray-800">{video.title}</h3>
                  {video.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(video.recordedDate)}</span>
                    <span>{formatDuration(video.durationSeconds)}</span>
                  </div>

                  {video.percentWatched > 0 && (
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, video.percentWatched)}%` }}
                      />
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    {!video.enrollmentActive ? (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                        <Lock className="h-3.5 w-3.5" />
                        Enrollment expired — contact the academy to renew
                      </div>
                    ) : (
                      <button
                        onClick={() => setPlayingVideo(video)}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {video.lastPositionSeconds > 10
                          ? `Continue Watching — ${Math.floor(
                              video.lastPositionSeconds / 60
                            )}:${String(video.lastPositionSeconds % 60).padStart(2, "0")}`
                          : "Watch"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {playingVideo && (
        <RecordedClassPlayer video={playingVideo} onClose={handleClosePlayer} />
      )}
    </div>
  );
};

export default RecordedClassesStudent;
