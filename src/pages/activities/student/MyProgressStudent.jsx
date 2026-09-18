import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import {
  TrendingUp,
  FileText,
  Video,
  Paperclip,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Full, static Tailwind class names per tone — Tailwind's build-time
// scanner only picks up classes it can see literally in source, so a
// template-string interpolation like `bg-${tone}-500` would silently
// produce no styling at all once this ships through a real build.
const TONE_BAR_CLASSES = {
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

const TONE_ICON_CLASSES = {
  indigo: "text-indigo-500",
  blue: "text-blue-500",
  rose: "text-rose-500",
  amber: "text-amber-500",
  emerald: "text-emerald-500",
};

const ProgressBar = ({ percent, tone = "indigo" }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full ${TONE_BAR_CLASSES[tone] || TONE_BAR_CLASSES.indigo}`}
      style={{ width: `${Math.min(100, Math.max(0, percent || 0))}%` }}
    />
  </div>
);

const SummaryCard = ({ icon: Icon, label, completed, total, percent, tone }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-center gap-2 text-gray-500">
      <Icon className={`h-4 w-4 ${TONE_ICON_CLASSES[tone] || TONE_ICON_CLASSES.indigo}`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold text-gray-800">{completed}</span>
      <span className="text-gray-400 mb-0.5">/ {total}</span>
    </div>
    <ProgressBar percent={percent} tone={tone} />
    <span className="text-xs text-gray-400">{percent}% complete</span>
  </div>
);

// The student's own view of the exact same figures the admin's Student
// Progress dashboard shows for them — computed by the same shared
// utils/studentProgressHelper.js on the backend, so these numbers can never
// disagree with what the admin sees.
const MyProgressStudent = () => {
  const { userData } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/student-progress/me`
        );
        setData(response.data?.data || null);
        setError(null);
      } catch (err) {
        setError("Failed to load your progress.");
      } finally {
        setLoading(false);
      }
    };
    if (userData?._id) fetchProgress();
  }, [userData]);

  return (
    <div className="p-5">
      <Navbar />
      <main className="mx-auto px-4 py-8 w-full max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
            My Progress
          </h1>
          <p className="text-gray-600 mt-1">
            Your exam, video, and material completion — updated automatically
            as you complete tests, watch classes, and view materials.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-500 py-16">{error}</div>
        ) : !data ? (
          <div className="text-center text-gray-400 py-16">No progress data yet.</div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white flex items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-100 text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Overall Progress
                </div>
                <div className="text-4xl font-bold">{data.overallProgress}%</div>
              </div>
              <div className="w-40 hidden sm:block">
                <div className="h-3 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${Math.min(100, data.overallProgress)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <SummaryCard
                icon={FileText}
                label="Exams"
                completed={data.exams.completed}
                total={data.exams.total}
                percent={data.exams.percent}
                tone="blue"
              />
              <SummaryCard
                icon={Video}
                label="Videos"
                completed={data.videos.completed}
                total={data.videos.total}
                percent={data.videos.percent}
                tone="rose"
              />
              <SummaryCard
                icon={Paperclip}
                label="Attachments"
                completed={data.attachments.completed}
                total={data.attachments.total}
                percent={data.attachments.percent}
                tone="amber"
              />
            </div>

            {data.videos.list?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-700 mb-3">Video Watch Progress</h2>
                <div className="flex flex-col gap-3">
                  {data.videos.list.map((v) => (
                    <div key={v.videoId} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-48 truncate">{v.title}</span>
                      <div className="flex-1">
                        <ProgressBar percent={v.percentWatched} tone={v.completed ? "emerald" : "rose"} />
                      </div>
                      <span className="text-xs text-gray-500 w-14 text-right">
                        {v.percentWatched}%
                      </span>
                      {v.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.attachments.list?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-700 mb-3">Materials</h2>
                <div className="flex flex-col gap-2">
                  {data.attachments.list.map((a) => (
                    <div
                      key={a.attachmentId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{a.title}</span>
                      {a.viewed ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Viewed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Not viewed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyProgressStudent;
