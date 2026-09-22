import axios from "axios";
import download from "downloadjs";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import {
  Search,
  Users,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  FileDown,
} from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

const STATUS_OPTIONS = [
  { value: "", label: "Any Status" },
  { value: "not_started", label: "Not Started" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

const STATUS_BADGE_CLASSES = {
  not_started: "bg-gray-100 text-gray-500",
  draft: "bg-amber-100 text-amber-700",
  submitted: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS = {
  not_started: "Not Started",
  draft: "Draft",
  submitted: "Submitted",
};

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
    <h2 className="font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs font-medium text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 break-words">{value || "—"}</p>
  </div>
);

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");

// Read-only mirror of the student-facing StudentProfilePage — every section
// rendered exactly as the student filled it in, matching the admin's
// explicit requirement ("whatever they attaching should be shown to admin
// login as in the image attached"). Nothing here is reshaped or summarized;
// this page is intentionally a near-duplicate layout of the student form,
// just non-editable.
const ProfileDetailContent = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/student-profiles/${studentId}`)
      .then((response) => {
        if (!cancelled) setData(response.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load this student's profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/student-profiles/${studentId}/photo`, {
        responseType: "blob",
      })
      .then((response) => {
        if (cancelled) return;
        const url = URL.createObjectURL(response.data);
        objectUrlRef.current = url;
        setPhotoUrl(url);
      })
      .catch(() => {
        // No photo on file — the placeholder box below handles that.
      });
    return () => {
      cancelled = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [studentId]);

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Loading…</div>;
  }
  if (!data) {
    return <div className="text-center text-gray-400 py-10">No data.</div>;
  }

  const { student, profile } = data;

  if (!profile) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Field label="Name" value={student.name} />
          <Field label="Email" value={student.email} />
          <Field label="Register No." value={student.registerNumber} />
          <Field label="Course" value={getCategoryLabel(student.category)} />
        </div>
        <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-2">
          <UserIcon className="h-6 w-6 text-gray-300" />
          This student hasn't started their profile yet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Field label="Name" value={student.name} />
        <Field label="Email" value={student.email} />
        <Field label="Register No." value={student.registerNumber} />
        <Field label="Course" value={getCategoryLabel(student.category)} />
      </div>

      <SectionCard title="Batch & Enrollment">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Roll / Reg. No." value={profile.rollNumber} />
          <Field label="Batch / Course" value={profile.batchCourse} />
          <Field label="Target Exam" value={profile.targetExam} />
          <Field label="Date of Joining" value={formatDate(profile.dateOfJoining)} />
          <Field label="Batch Mode" value={profile.batchMode} />
          <Field label="Batch Timing" value={profile.batchTiming} />
        </div>
      </SectionCard>

      <SectionCard title="1. Student Personal Details">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <Field label="Full Name" value={profile.fullName} />
            <Field label="Gender" value={profile.gender} />
            <Field label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
            <Field label="Aadhaar No." value={profile.aadhaarNo} />
            <Field label="Blood Group" value={profile.bloodGroup} />
            <Field label="Primary Mobile No." value={profile.primaryMobile} />
            <Field label="WhatsApp No." value={profile.whatsappNo} />
            <Field label="Personal Email ID" value={profile.personalEmail} />
            <Field label="Student Type" value={profile.studentType} />
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="h-32 w-28 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-gray-400 text-center px-2">No photo</span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Parent / Permanent Guardian Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Father's Name" value={profile.fatherName} />
          <Field label="Father's Occupation" value={profile.fatherOccupation} />
          <Field label="Mother's Name" value={profile.motherName} />
          <Field label="Mother's Occupation" value={profile.motherOccupation} />
          <Field label="Father's Contact No." value={profile.fatherContactNo} />
          <Field label="Mother's Contact No." value={profile.motherContactNo} />
          <Field label="Parent WhatsApp No." value={profile.parentWhatsappNo} />
          <Field label="Parent Email ID" value={profile.parentEmailId} />
          <Field label="Permanent Home Address" value={profile.permanentHomeAddress} />
          <Field label="District & State" value={profile.districtState} />
          <Field label="PIN Code" value={profile.pinCode} />
        </div>
      </SectionCard>

      <SectionCard title="3. Emergency Contact & Local Accommodation Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Emergency Contact Person" value={profile.emergencyContactPerson} />
          <Field label="Relationship" value={profile.emergencyRelationship} />
          <Field label="Emergency Mobile No." value={profile.emergencyMobileNo} />
          <Field label="Alternative Phone No." value={profile.alternativePhoneNo} />
          <Field label="Hostel / PG / Rental Address" value={profile.hostelPgRentalAddress} />
          <Field
            label="Local Guardian / Roommate Name"
            value={profile.localGuardianRoommateName}
          />
          <Field label="Guardian / PG Contact No." value={profile.guardianPgContactNo} />
        </div>
      </SectionCard>

      <SectionCard title="4. Academic Background & Qualifications">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="py-2 pr-2">Degree / Level</th>
                <th className="py-2 pr-2">Institution / College Name & Location</th>
                <th className="py-2 pr-2">Branch / Specialization</th>
                <th className="py-2 pr-2">Year</th>
                <th className="py-2 pr-2">% / CGPA</th>
              </tr>
            </thead>
            <tbody>
              {(profile.academicRecords || []).map((row, idx) => (
                <tr key={idx} className="border-t border-gray-50">
                  <td className="py-2 pr-2 font-medium text-gray-700">{row.level}</td>
                  <td className="py-2 pr-2 text-gray-700">{row.institutionName || "—"}</td>
                  <td className="py-2 pr-2 text-gray-700">{row.branchSpecialization || "—"}</td>
                  <td className="py-2 pr-2 text-gray-700">{row.year || "—"}</td>
                  <td className="py-2 pr-2 text-gray-700">{row.percentageOrCgpa || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Joint Declaration & Undertaking">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Student Signature</p>
            <p className="text-sm text-gray-800 italic">
              {profile.studentSignatureName || "— not signed —"}
            </p>
            {profile.studentAgreed ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Agreed{profile.studentSignedAt && ` — ${formatDate(profile.studentSignedAt)}`}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <XCircle className="h-3.5 w-3.5" />
                Not yet agreed
              </span>
            )}
          </div>
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Parent / Guardian Signature
            </p>
            <p className="text-sm text-gray-800 italic">
              {profile.parentSignatureName || "— not signed —"}
            </p>
            {profile.parentAgreed ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Agreed{profile.parentSignedAt && ` — ${formatDate(profile.parentSignedAt)}`}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <XCircle className="h-3.5 w-3.5" />
                Not yet agreed
              </span>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// Student Profiles admin page — every student, whether they've completed
// their Personal/Academic/Declaration profile, and (via "View Detail") the
// exact content they submitted, mirroring the student-facing form
// section-for-section so nothing is summarized or reshaped in between.
const StudentProfilesAdminPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [detailStudentId, setDetailStudentId] = useState(null);
  const [detailStudentName, setDetailStudentName] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Admin-only PDF export — never wired up anywhere on the student-facing
  // StudentProfilePage. Fetched as a blob (the endpoint requires the same
  // Bearer token every other admin call already sends via axios' global
  // Authorization header) and handed to downloadjs, same pattern used
  // elsewhere in this app for file downloads.
  const handleDownloadPdf = async (studentId, studentName) => {
    if (!studentId) return;
    try {
      setDownloadingPdf(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/student-profiles/${studentId}/pdf`,
        { responseType: "blob" }
      );
      const filenameSafeName = (studentName || "student").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      download(response.data, `${filenameSafeName}-profile.pdf`, "application/pdf");
    } catch (error) {
      toast.error("Failed to generate the profile PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/student-profiles`,
        { params }
      );
      setRows(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load student profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchRows, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, status]);

  return (
    <div className="flex flex-col gap-6 w-full font-inter">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-stone-700 font-bold font-poppins">Student Profiles</h1>
        <p className="text-stone-400 font-medium">
          Personal information, academic background, and the joint
          student/parent declaration — exactly as each student submitted it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, register number…"
            className="flex-1 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Courses</option>
          {EXAM_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Student Signed</th>
              <th className="px-4 py-3">Parent Signed</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Users className="h-6 w-6 text-gray-300" />
                    No students match these filters.
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.studentId} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{getCategoryLabel(row.category)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_BADGE_CLASSES[row.profileStatus] || STATUS_BADGE_CLASSES.not_started
                      }`}
                    >
                      {STATUS_LABELS[row.profileStatus] || "Not Started"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.studentAgreed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.parentAgreed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.lastUpdatedAt ? new Date(row.lastUpdatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setDetailStudentId(row.studentId);
                        setDetailStudentName(row.name);
                      }}
                      className="text-xs font-medium bg-indigo-500 text-white px-3 py-1.5 rounded-full hover:bg-indigo-600"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!detailStudentId}
        onClose={() => setDetailStudentId(null)}
        maxWidth="md"
        fullWidth
      >
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-6">
            <h2 className="text-xl font-bold text-stone-700 font-poppins">Student Profile</h2>
            <div className="flex items-center gap-4">
              {/* Admin-only — this button never appears on the student's own
                  profile page. */}
              <button
                onClick={() => handleDownloadPdf(detailStudentId, detailStudentName)}
                disabled={downloadingPdf}
                className="flex items-center gap-1.5 text-xs font-medium bg-stone-700 text-white px-3 py-1.5 rounded-full hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="h-3.5 w-3.5" />
                {downloadingPdf ? "Preparing…" : "Download PDF"}
              </button>
              <MdClose
                onClick={() => setDetailStudentId(null)}
                className="text-stone-500 font-medium text-3xl cursor-pointer hover:opacity-80 duration-300"
              />
            </div>
          </div>
          {detailStudentId && <ProfileDetailContent studentId={detailStudentId} />}
        </div>
      </Dialog>
    </div>
  );
};

export default StudentProfilesAdminPage;
