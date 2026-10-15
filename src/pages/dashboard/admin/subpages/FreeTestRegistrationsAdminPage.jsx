import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { Download, Search, UserCheck } from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

// Admin view of everyone who registered on the public /free-test page
// (backend: controllers/freeTestController.js listRegistrations /
// convertToStudent). Shows their details, whether they've taken the free
// test, score and rank among everyone who took it, and lets the admin turn
// a registrant who joined the academy into a regular student.

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "—";

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const FreeTestRegistrationsAdminPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [testFilter, setTestFilter] = useState("all");

  const [converting, setConverting] = useState(null);
  const [registerNumber, setRegisterNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/free-test/registrations`,
        { params: category !== "all" ? { category } : {} }
      );
      setRows(data?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (testFilter === "taken" && !r.test) return false;
      if (testFilter === "not-taken" && r.test) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone, r.city, r.college]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query, testFilter]);

  const takenCount = rows.filter((r) => r.test).length;

  const handleExport = () => {
    const header = [
      "Name", "Email", "Mobile", "City", "Exam", "Qualification", "College",
      "Year of passing", "Current status", "Heard from", "Registered",
      "Test taken", "Marks", "Rank", "Out of", "Time taken",
    ];
    const lines = filtered.map((r) =>
      [
        r.name, r.email, r.phone, r.city, r.categoryLabel, r.qualification,
        r.college, r.passingYear, r.currentStatus, r.heardFrom,
        formatDate(r.registeredAt), r.test ? "Yes" : "No",
        r.test?.obtainedMark ?? "", r.test?.rank ?? "", r.test?.totalTakers ?? "",
        r.test ? formatTime(r.test.timeTakenSeconds) : "",
      ].map(csvCell).join(",")
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "free-test-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (!registerNumber.trim()) {
      toast.error("Enter the student's register number.");
      return;
    }
    setSaving(true);
    try {
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/free-test/registrations/${converting._id}/convert`,
        { registerNumber: registerNumber.trim() }
      );
      toast.success(
        `${converting.name} is now a regular student. Set their enrollment in Users.`
      );
      setConverting(null);
      setRegisterNumber("");
      fetchRows();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to convert.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-inter">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins">
            Free Test Registrations
          </h1>
          <p className="text-stone-400 font-medium">
            Everyone who registered on the public Free Test page. Mark one
            exam per category as a free test in the exam builder to open it.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 text-nowrap border border-indigo-400 text-indigo-500 font-medium py-2 px-4 rounded-2xl font-poppins hover:bg-indigo-50 duration-300 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[{ value: "all", label: "All Categories" }, ...EXAM_CATEGORY_OPTIONS].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCategory(opt.value)}
            className={`py-1.5 px-4 rounded-full text-sm font-medium duration-300 ${
              category === opt.value
                ? "bg-indigo-500 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold">Registered</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold">Took the test</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{takenCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold">Not yet taken</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{rows.length - takenCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, mobile, city, college"
            className="w-full border border-stone-300 rounded-2xl py-2 pl-9 pr-4 bg-white focus:outline-stone-300"
          />
        </div>
        <select
          value={testFilter}
          onChange={(e) => setTestFilter(e.target.value)}
          className="border border-stone-300 rounded-2xl py-2 px-4 bg-white"
        >
          <option value="all">All</option>
          <option value="taken">Took the test</option>
          <option value="not-taken">Not yet taken</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Exam</th>
              <th className="px-4 py-3">Background</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Free test result</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">
                  No registrations yet.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r._id} className="border-t border-gray-50 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.city || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{r.phone || "—"}</p>
                    <p className="text-xs text-gray-400 break-all">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.categoryLabel || getCategoryLabel(r.category)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {[r.qualification, r.college, r.passingYear].filter(Boolean).join(" · ") || "—"}
                    {r.currentStatus && <p className="text-gray-400">{r.currentStatus}</p>}
                    {r.heardFrom && <p className="text-gray-400">Heard via {r.heardFrom}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(r.registeredAt)}</td>
                  <td className="px-4 py-3">
                    {r.test ? (
                      <div className="text-xs text-gray-700">
                        <p className="font-semibold text-gray-800">
                          {r.test.obtainedMark ?? 0} marks · Rank {r.test.rank} of {r.test.totalTakers}
                        </p>
                        <p className="text-gray-400">
                          {formatTime(r.test.timeTakenSeconds)} · {formatDate(r.test.completedAt)}
                        </p>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Not taken yet
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setConverting(r);
                        setRegisterNumber("");
                      }}
                      title="This person joined the academy — make them a regular student"
                      className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-nowrap"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Convert to student
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(converting)} onClose={saving ? undefined : () => setConverting(null)}>
        <div className="flex flex-col gap-5 sm:min-w-[440px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">Convert to student</h1>
              <p className="text-sm text-stone-500">
                {converting?.name} becomes a regular student. They'll be asked
                to fill the student profile at their next login. Set their
                course enrollment in Users afterwards.
              </p>
            </div>
            {!saving && (
              <MdClose
                onClick={() => setConverting(null)}
                className="text-stone-500 text-4xl cursor-pointer hover:opacity-80"
              />
            )}
          </div>
          <input
            value={registerNumber}
            onChange={(e) => setRegisterNumber(e.target.value)}
            placeholder="Register number"
            className="border border-stone-300 py-[10px] px-4 rounded-2xl bg-white focus:outline-stone-300"
            disabled={saving}
          />
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setConverting(null)}
              disabled={saving}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={saving}
              className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins disabled:opacity-50"
            >
              {saving ? "Saving…" : "Convert"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default FreeTestRegistrationsAdminPage;
