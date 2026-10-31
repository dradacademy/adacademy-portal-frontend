import React, { useContext, useEffect, useMemo, useState } from "react";
import { PartBadge, matchesPart } from "../../../components/dashboard/admin/SubjectTopicPicker";
import axios from "axios";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import RecordedClassPlayer from "../../../components/activities/student/RecordedClassPlayer";
import LiveClassPlayer from "../../../components/activities/student/LiveClassPlayer";
import {
  Video,
  PlayCircle,
  Lock,
  Megaphone,
  CalendarClock,
  BookOpen,
  ArrowDownUp,
  Calendar,
} from "lucide-react";
import {
  NO_SUBTOPIC,
  groupRecordings,
  listSubjects,
  subjectKey,
} from "../../../utils/recordedClassGroups";
import { daysLeft, formatIstDate } from "../../../utils/classAvailability";
import ContentCover from "../../../components/common/ContentCover";

// "Available till 22 Oct 2026" under each class, turning into an amber
// "Expiring soon" warning in its last 2 days so students watch in time.
const AvailableTill = ({ until }) => {
  if (!until) return null;
  const left = daysLeft(until);
  const soon = left !== null && left <= 2;
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium ${
        soon ? "text-amber-700" : "text-gray-500"
      }`}
    >
      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
      <span>Available till {formatIstDate(until)}</span>
      {soon && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
          {left === 0 ? "Last day" : "Expiring soon"}
        </span>
      )}
    </div>
  );
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const ALL = "__all__";

// Remember the student's last subject / sort choice on this device.
const loadPref = (key, fallback) => {
  try {
    return window.localStorage.getItem(`recordedClasses.${key}`) || fallback;
  } catch {
    return fallback;
  }
};
const savePref = (key, value) => {
  try {
    window.localStorage.setItem(`recordedClasses.${key}`, value);
  } catch {
    // storage unavailable — fine, just not remembered
  }
};

const VideoCard = ({ video, onPlay }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
    <ContentCover
      title={video.title}
      subject={video.subject?.name}
      topic={video.subtopic?.name}
      kind="video"
      badge={
        <span className="flex items-center gap-1 bg-white/90 text-gray-800 text-xs font-semibold px-2 py-1 rounded-lg shadow-sm">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(video.recordedDate)}
        </span>
      }
    />
    <div className="p-4 flex flex-col gap-2 flex-1">
      {/* The cover already shows the name; kept for screen readers. */}
      <h3 className="sr-only">{video.title}</h3>
      {video.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{video.description}</p>
      )}
      {video.part && <PartBadge part={video.part} className="self-start" />}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{video.percentWatched > 0 ? `${Math.round(video.percentWatched)}% watched` : ""}</span>
        <span>{formatDuration(video.durationSeconds)}</span>
      </div>
      <AvailableTill until={video.availableUntil} />

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
        ) : video.accessLevel === "test_series_only" ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <Lock className="h-3.5 w-3.5" />
            Test Series Only plan — contact the academy to upgrade
          </div>
        ) : (
          <button
            onClick={() => onPlay(video)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2 rounded-xl transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
            {video.lastPositionSeconds > 10
              ? `Continue Watching — ${Math.floor(video.lastPositionSeconds / 60)}:${String(
                  video.lastPositionSeconds % 60
                ).padStart(2, "0")}`
              : "Watch"}
          </button>
        )}
      </div>
    </div>
  </div>
);

const VideoGrid = ({ videos, onPlay }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {videos.map((video) => (
      <VideoCard key={video._id} video={video} onPlay={onPlay} />
    ))}
  </div>
);

// One subtopic block: heading + its classes in date order.
const SubtopicSection = ({ topic, onPlay, showHeading = true }) => (
  <section className="flex flex-col gap-3">
    {showHeading && (
      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span
          className={`h-2 w-2 rounded-full ${
            topic.key === NO_SUBTOPIC ? "bg-gray-300" : "bg-indigo-400"
          }`}
        />
        {topic.name}
        <span className="text-xs font-normal text-gray-400">
          {topic.count} class{topic.count === 1 ? "" : "es"}
        </span>
      </h4>
    )}
    <VideoGrid videos={topic.videos} onPlay={onPlay} />
  </section>
);

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
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingLiveClass, setPlayingLiveClass] = useState(null);

  // Subject → Subtopic → by date browsing.
  const [subjectFilter, setSubjectFilter] = useState(() => loadPref("subject", ALL));
  const [subtopicFilter, setSubtopicFilter] = useState(ALL);
  // Theory / Problems filter (2026-10-31) — shown only when classes have it.
  const [partFilter, setPartFilter] = useState(ALL);
  const [sortDir, setSortDir] = useState(() => loadPref("sort", "asc"));

  const hasParts = videos.some((v) => v.part);
  const partVideos = useMemo(
    () => (partFilter === ALL ? videos : videos.filter((v) => matchesPart(v.part, partFilter))),
    [videos, partFilter]
  );
  const subjects = useMemo(() => listSubjects(partVideos), [partVideos]);

  // A remembered subject that no longer has classes falls back to "All".
  const activeSubject = subjects.some((s) => s.key === subjectFilter) ? subjectFilter : ALL;

  const groups = useMemo(() => {
    const inSubject =
      activeSubject === ALL ? partVideos : partVideos.filter((v) => subjectKey(v) === activeSubject);
    return groupRecordings(inSubject, sortDir);
  }, [partVideos, activeSubject, sortDir]);

  const subtopicsOfSubject = activeSubject === ALL ? [] : groups[0]?.subtopics || [];
  const activeSubtopic = subtopicsOfSubject.some((t) => t.key === subtopicFilter)
    ? subtopicFilter
    : ALL;

  const chooseSubject = (key) => {
    setSubjectFilter(key);
    setSubtopicFilter(ALL);
    savePref("subject", key);
  };
  const toggleSort = () => {
    const next = sortDir === "asc" ? "desc" : "asc";
    setSortDir(next);
    savePref("sort", next);
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const [videosResponse, liveResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_API_URL}/videos/available`),
        axios.get(`${import.meta.env.VITE_APP_API_URL}/live-classes/current`),
      ]);
      setVideos(videosResponse.data?.data || []);
      setLiveClasses(liveResponse.data?.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load classes.");
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

  const handleCloseLivePlayer = () => {
    setPlayingLiveClass(null);
  };

  return (
    <div className="p-5">
      <Navbar />
      <main className="mx-auto px-4 py-8 w-full max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            Classes
          </h1>
          <p className="text-gray-600 mt-1">
            Join a class while it's live, or stream any past recording
            anytime — view only, no downloads.
          </p>
        </div>

        {!loading && liveClasses.length > 0 && (
          <div className="mb-8 flex flex-col gap-3">
            {liveClasses.map((liveClass) => (
              <div
                key={liveClass._id}
                className="bg-gradient-to-r from-rose-50 to-white border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 bg-rose-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    LIVE NOW
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">{liveClass.title}</p>
                    <p className="text-xs text-gray-500">
                      Started {new Date(liveClass.startedAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {!liveClass.enrollmentActive ? (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium shrink-0">
                    <Lock className="h-3.5 w-3.5" />
                    Enrollment expired
                  </div>
                ) : liveClass.accessLevel === "test_series_only" ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium shrink-0">
                    <Lock className="h-3.5 w-3.5" />
                    Test Series Only plan — live classes not included
                  </div>
                ) : (
                  <button
                    onClick={() => setPlayingLiveClass(liveClass)}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors shrink-0"
                  >
                    <Megaphone className="h-4 w-4" />
                    Join Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-700 mb-3">Recorded Classes</h2>

        {!loading && !error && videos.length > 0 && (
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span className="font-medium">Subject</span>
                <select
                  value={activeSubject}
                  onChange={(e) => chooseSubject(e.target.value)}
                  className="border border-gray-300 rounded-xl py-2 pl-3 pr-8 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 max-w-[70vw]"
                >
                  <option value={ALL}>All subjects ({partVideos.length})</option>
                  {subjects.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name} ({s.count})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={toggleSort}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-xl py-2 px-3 bg-white hover:bg-gray-50"
                title="Change date order"
              >
                <ArrowDownUp className="h-4 w-4" />
                {sortDir === "asc" ? "Oldest first" : "Newest first"}
              </button>
            </div>

            {hasParts && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {[
                  [ALL, "All classes"],
                  ["theory", "📘 Theory"],
                  ["problems", "✏️ Problems"],
                  ["both", "📘✏️ Theory + Problems"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPartFilter(key)}
                    className={`shrink-0 py-1.5 px-3.5 rounded-full text-sm font-semibold transition-colors ${
                      partFilter === key ? "bg-navy text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {subtopicsOfSubject.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {[{ key: ALL, name: "All subtopics", count: null }, ...subtopicsOfSubject].map(
                  (t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setSubtopicFilter(t.key)}
                      className={`shrink-0 py-1.5 px-3.5 rounded-full text-sm font-medium transition-colors ${
                        activeSubtopic === t.key
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t.name}
                      {t.count !== null && (
                        <span className="ml-1.5 opacity-75">{t.count}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-500 py-16">{error}</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-gray-400 py-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center gap-2">
            <Video className="h-8 w-8 text-gray-300" />
            No recorded classes are available for your course yet.
          </div>
        ) : partVideos.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No {partFilter === "theory" ? "Theory" : partFilter === "problems" ? "Problems" : "Theory + Problems"} classes yet — tap "All classes".
          </div>
        ) : activeSubject === ALL ? (
          <div className="flex flex-col gap-10">
            {groups.map((subject) => (
              <div key={subject.key} className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                  <h3 className="text-base md:text-lg font-bold text-gray-800">
                    {subject.name}
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      {subject.count} class{subject.count === 1 ? "" : "es"}
                    </span>
                  </h3>
                  {subject.subtopics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => chooseSubject(subject.key)}
                      className="text-sm text-indigo-600 font-medium hover:underline shrink-0"
                    >
                      Open subject →
                    </button>
                  )}
                </div>
                {subject.subtopics.map((topic) => (
                  <SubtopicSection
                    key={topic.key}
                    topic={topic}
                    onPlay={setPlayingVideo}
                    showHeading={subject.subtopics.length > 1 || topic.key !== NO_SUBTOPIC}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {subtopicsOfSubject
              .filter((t) => activeSubtopic === ALL || t.key === activeSubtopic)
              .map((topic) => (
                <SubtopicSection
                  key={topic.key}
                  topic={topic}
                  onPlay={setPlayingVideo}
                  showHeading={subtopicsOfSubject.length > 1 || topic.key !== NO_SUBTOPIC}
                />
              ))}
          </div>
        )}
      </main>

      {playingVideo && (
        <RecordedClassPlayer video={playingVideo} onClose={handleClosePlayer} />
      )}

      {playingLiveClass && (
        <LiveClassPlayer liveClass={playingLiveClass} onClose={handleCloseLivePlayer} />
      )}
    </div>
  );
};

export default RecordedClassesStudent;
