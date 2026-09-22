import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import { Camera, CheckCircle2, PenLine, Save } from "lucide-react";

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
    <h2 className="font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500">{label}</label>
    {children}
  </div>
);

const inputClass =
  "border border-stone-300 py-2 px-3 rounded-xl bg-white text-sm focus:outline-stone-300 w-full";

const RadioGroup = ({ name, value, options, onChange }) => (
  <div className="flex flex-wrap gap-4">
    {options.map((opt) => (
      <label key={opt.value} className="flex items-center gap-1.5 text-sm text-gray-600">
        <input
          type="radio"
          name={name}
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
        />
        {opt.label}
      </label>
    ))}
  </div>
);

const ACADEMIC_ROW_LABELS = ["B.E. / B.Tech / Degree", "Diploma / HSC (12th)", "SSLC (10th)"];

const EMPTY_ACADEMIC_ROWS = ACADEMIC_ROW_LABELS.map((level) => ({
  level,
  institutionName: "",
  branchSpecialization: "",
  year: "",
  percentageOrCgpa: "",
}));

// The Student Profile page — Personal Information, Parent/Guardian details,
// Emergency contact, Academic background, the academy's printed Rules &
// Code of Conduct, and the Joint Declaration & Undertaking with typed
// digital signatures for both the student and their parent/guardian. This
// mirrors the academy's existing paper intake form field-for-field, so
// whatever a student fills in here is exactly what the admin sees on the
// Student Profiles admin page — nothing summarized or reshaped in between.
const StudentProfilePage = () => {
  const { userData, fetchUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/student-profiles/me`
      );
      const data = response.data?.data;
      if (data.academicRecords?.length !== 3) {
        data.academicRecords = EMPTY_ACADEMIC_ROWS.map((row, idx) => ({
          ...row,
          ...(data.academicRecords?.[idx] || {}),
        }));
      }
      setProfile(data);
    } catch (error) {
      toast.error("Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?._id) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  useEffect(() => {
    if (!userData?._id) return;
    let cancelled = false;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/student-profiles/${userData._id}/photo`, {
        responseType: "blob",
      })
      .then((response) => {
        if (cancelled) return;
        const url = URL.createObjectURL(response.data);
        objectUrlRef.current = url;
        setPhotoUrl(url);
      })
      .catch(() => {
        // No photo yet — fine, the placeholder box handles that.
      });
    return () => {
      cancelled = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [userData, profile?.photoGridFsFileId]);

  const setField = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  const setAcademicField = (idx, key, value) => {
    setProfile((prev) => {
      const rows = [...prev.academicRecords];
      rows[idx] = { ...rows[idx], [key]: value };
      return { ...prev, academicRecords: rows };
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/student-profiles/me/photo`,
        formData
      );
      toast.success("Photo updated.");
      fetchProfile();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/student-profiles/me`,
        profile
      );
      const savedProfile = response.data?.data;
      setProfile(savedProfile);
      toast.success("Profile saved.");

      // The moment both declarations are signed, status flips to
      // "submitted" and the rest of the portal should unlock immediately —
      // re-fetch /users/me so userData.profileCompleted updates without
      // requiring a logout/login (see App.jsx's profileLocked guard and
      // Navbar.jsx's lock banner, both driven off that flag).
      if (savedProfile?.status === "submitted" && !userData?.profileCompleted) {
        fetchUser();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-5">
        <Navbar />
        <main className="mx-auto px-4 py-16 w-full max-w-4xl text-center text-gray-400">
          Loading…
        </main>
      </div>
    );
  }

  return (
    <div className="p-5">
      <Navbar />
      <main className="mx-auto px-4 py-8 w-full max-w-4xl flex flex-col gap-6">
        <div className="text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">
            DR. A. D. ACADEMY OF EXCELLENCE
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            9/1, Ponthottam Nagar, Saravanampatti, Coimbatore – 641 035
          </p>
          <p className="text-xs text-gray-400">
            Phone: +91 95668 18665 | Helpline: +91 93633 18665 | Email: dradacademy@gmail.com
          </p>
          <h2 className="text-lg font-semibold text-gray-700 mt-3">STUDENT PROFILE</h2>
        </div>

        <SectionCard title="Batch & Enrollment">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Roll / Reg. No.">
              <input
                className={inputClass}
                value={profile.rollNumber}
                onChange={(e) => setField("rollNumber", e.target.value)}
              />
            </Field>
            <Field label="Batch / Course">
              <input
                className={inputClass}
                value={profile.batchCourse}
                onChange={(e) => setField("batchCourse", e.target.value)}
              />
            </Field>
            <Field label="Target Exam">
              <input
                className={inputClass}
                value={profile.targetExam}
                onChange={(e) => setField("targetExam", e.target.value)}
              />
            </Field>
            <Field label="Date of Joining">
              <input
                type="date"
                className={inputClass}
                value={profile.dateOfJoining ? profile.dateOfJoining.slice(0, 10) : ""}
                onChange={(e) => setField("dateOfJoining", e.target.value)}
              />
            </Field>
            <Field label="Batch Mode">
              <RadioGroup
                name="batchMode"
                value={profile.batchMode}
                onChange={(v) => setField("batchMode", v)}
                options={[
                  { value: "offline", label: "Offline" },
                  { value: "online", label: "Online" },
                  { value: "hybrid", label: "Hybrid" },
                ]}
              />
            </Field>
            <Field label="Batch Timing">
              <RadioGroup
                name="batchTiming"
                value={profile.batchTiming}
                onChange={(v) => setField("batchTiming", v)}
                options={[
                  { value: "morning", label: "Morning" },
                  { value: "evening", label: "Evening" },
                  { value: "weekend", label: "Weekend" },
                ]}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="1. Student Personal Details">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <Field label="Full Name (BLOCK LETTERS)">
                <input
                  className={inputClass}
                  value={profile.fullName}
                  onChange={(e) => setField("fullName", e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="Gender">
                <RadioGroup
                  name="gender"
                  value={profile.gender}
                  onChange={(v) => setField("gender", v)}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                />
              </Field>
              <Field label="Date of Birth">
                <input
                  type="date"
                  className={inputClass}
                  value={profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : ""}
                  onChange={(e) => setField("dateOfBirth", e.target.value)}
                />
              </Field>
              <Field label="Aadhaar No.">
                <input
                  className={inputClass}
                  value={profile.aadhaarNo}
                  onChange={(e) => setField("aadhaarNo", e.target.value)}
                />
              </Field>
              <Field label="Blood Group">
                <input
                  className={inputClass}
                  value={profile.bloodGroup}
                  onChange={(e) => setField("bloodGroup", e.target.value)}
                />
              </Field>
              <Field label="Primary Mobile No.">
                <input
                  className={inputClass}
                  value={profile.primaryMobile}
                  onChange={(e) => setField("primaryMobile", e.target.value)}
                />
              </Field>
              <Field label="WhatsApp No.">
                <input
                  className={inputClass}
                  value={profile.whatsappNo}
                  onChange={(e) => setField("whatsappNo", e.target.value)}
                />
              </Field>
              <Field label="Personal Email ID">
                <input
                  className={inputClass}
                  value={profile.personalEmail}
                  onChange={(e) => setField("personalEmail", e.target.value)}
                />
              </Field>
              <Field label="Student Type">
                <RadioGroup
                  name="studentType"
                  value={profile.studentType}
                  onChange={(v) => setField("studentType", v)}
                  options={[
                    { value: "day_scholar", label: "Day Scholar" },
                    { value: "hosteller_pg", label: "Hosteller / PG" },
                  ]}
                />
              </Field>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="h-32 w-28 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gray-400 text-center px-2">
                    Affix Recent Passport Size Photograph Here
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {uploadingPhoto ? "Uploading…" : "Upload Photo"}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="2. Parent / Permanent Guardian Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Father's Name">
              <input
                className={inputClass}
                value={profile.fatherName}
                onChange={(e) => setField("fatherName", e.target.value)}
              />
            </Field>
            <Field label="Father's Occupation">
              <input
                className={inputClass}
                value={profile.fatherOccupation}
                onChange={(e) => setField("fatherOccupation", e.target.value)}
              />
            </Field>
            <Field label="Mother's Name">
              <input
                className={inputClass}
                value={profile.motherName}
                onChange={(e) => setField("motherName", e.target.value)}
              />
            </Field>
            <Field label="Mother's Occupation">
              <input
                className={inputClass}
                value={profile.motherOccupation}
                onChange={(e) => setField("motherOccupation", e.target.value)}
              />
            </Field>
            <Field label="Father's Contact No.">
              <input
                className={inputClass}
                value={profile.fatherContactNo}
                onChange={(e) => setField("fatherContactNo", e.target.value)}
              />
            </Field>
            <Field label="Mother's Contact No.">
              <input
                className={inputClass}
                value={profile.motherContactNo}
                onChange={(e) => setField("motherContactNo", e.target.value)}
              />
            </Field>
            <Field label="Parent WhatsApp No.">
              <input
                className={inputClass}
                value={profile.parentWhatsappNo}
                onChange={(e) => setField("parentWhatsappNo", e.target.value)}
              />
            </Field>
            <Field label="Parent Email ID">
              <input
                className={inputClass}
                value={profile.parentEmailId}
                onChange={(e) => setField("parentEmailId", e.target.value)}
              />
            </Field>
            <Field label="Permanent Home Address">
              <textarea
                className={inputClass}
                rows={2}
                value={profile.permanentHomeAddress}
                onChange={(e) => setField("permanentHomeAddress", e.target.value)}
              />
            </Field>
            <Field label="District & State">
              <input
                className={inputClass}
                value={profile.districtState}
                onChange={(e) => setField("districtState", e.target.value)}
              />
            </Field>
            <Field label="PIN Code">
              <input
                className={inputClass}
                value={profile.pinCode}
                onChange={(e) => setField("pinCode", e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="3. Emergency Contact & Local Accommodation Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Emergency Contact Person">
              <input
                className={inputClass}
                value={profile.emergencyContactPerson}
                onChange={(e) => setField("emergencyContactPerson", e.target.value)}
              />
            </Field>
            <Field label="Relationship">
              <input
                className={inputClass}
                value={profile.emergencyRelationship}
                onChange={(e) => setField("emergencyRelationship", e.target.value)}
              />
            </Field>
            <Field label="Emergency Mobile No (Mandatory)">
              <input
                className={inputClass}
                value={profile.emergencyMobileNo}
                onChange={(e) => setField("emergencyMobileNo", e.target.value)}
                required
              />
            </Field>
            <Field label="Alternative Phone No.">
              <input
                className={inputClass}
                value={profile.alternativePhoneNo}
                onChange={(e) => setField("alternativePhoneNo", e.target.value)}
              />
            </Field>
            <Field label="Hostel / PG / Rental Address">
              <textarea
                className={inputClass}
                rows={2}
                value={profile.hostelPgRentalAddress}
                onChange={(e) => setField("hostelPgRentalAddress", e.target.value)}
              />
            </Field>
            <Field label="Local Guardian / Roommate Name">
              <input
                className={inputClass}
                value={profile.localGuardianRoommateName}
                onChange={(e) => setField("localGuardianRoommateName", e.target.value)}
              />
            </Field>
            <Field label="Guardian / PG Contact No.">
              <input
                className={inputClass}
                value={profile.guardianPgContactNo}
                onChange={(e) => setField("guardianPgContactNo", e.target.value)}
              />
            </Field>
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
                {profile.academicRecords.map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-50">
                    <td className="py-2 pr-2 font-medium text-gray-700">{row.level}</td>
                    <td className="py-2 pr-2">
                      <input
                        className={inputClass}
                        value={row.institutionName}
                        onChange={(e) =>
                          setAcademicField(idx, "institutionName", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className={inputClass}
                        value={row.branchSpecialization}
                        onChange={(e) =>
                          setAcademicField(idx, "branchSpecialization", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className={inputClass}
                        value={row.year}
                        onChange={(e) => setAcademicField(idx, "year", e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className={inputClass}
                        value={row.percentageOrCgpa}
                        onChange={(e) =>
                          setAcademicField(idx, "percentageOrCgpa", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Rules & Code of Conduct">
          <div className="flex flex-col gap-4 text-sm text-gray-600 max-h-96 overflow-y-auto pr-2">
            <div>
              <p className="font-semibold text-gray-700">
                1. Attendance, Academic Commitment & Examinations{" "}
                <span className="text-gray-400 font-normal">/ வருகை &amp; தேர்வுக் கடப்பாடு</span>
              </p>
              <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                <li>
                  Minimum 85% attendance is strictly mandatory across all scheduled
                  sessions. Students must arrive 5 minutes prior to class.
                </li>
                <li>
                  Participation in all weekly tests, subject evaluations, mock exams,
                  and test-review discussions is compulsory.
                </li>
                <li>
                  Leave must be formally intimated in advance. Unexcused absence for 3
                  consecutive days will be alerted directly to parents.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                2. Campus Ethics, Discipline &amp; Fee Policy{" "}
                <span className="text-gray-400 font-normal">
                  / வளாக ஒழுங்குமுறை மற்றும் கட்டண விதி
                </span>
              </p>
              <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                <li>
                  Mobile phones must be kept in Silent / Switch-off mode during
                  lectures and study hall hours. Strictly no non-academic browsing.
                </li>
                <li>
                  Strict maintenance of academic discipline and mutual respect towards
                  mentors, administrative staff, and fellow peers is required.
                </li>
                <li>
                  Academy infrastructure (furniture, computers, smart boards,
                  electricals) must be handled with utmost care. Damages will be
                  penalized.
                </li>
                <li>
                  The academy strictly prohibits unauthorized loitering or disruption
                  to the learning ambiance; non-compliance warrants immediate
                  termination of enrollment. Fees once remitted are strictly
                  Non-Refundable and Non-Transferable under any circumstances or
                  disciplinary dismissal.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                3. Institutional Jurisdiction &amp; Parental Oversight Policy{" "}
                <span className="text-gray-400 font-normal">
                  / மைய வளாக எல்லை மற்றும் பெற்றோர் பொறுப்பு
                </span>
              </p>
              <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                <li>
                  <span className="font-medium">Within Campus Premises:</span> The
                  Academy provides a secure, monitored, disciplined, and nurturing
                  academic environment throughout official operational hours,
                  prioritizing every student's safety, mental focus, and holistic
                  academic growth.
                </li>
                <li>
                  <span className="font-medium">Outside Campus Premises:</span>{" "}
                  Parental and guardian supervision, guidance, and proactive oversight
                  are respectfully requested regarding the student's daily commute,
                  personal accommodation (PG/hostel/rentals), dietary well-being, and
                  external safety beyond academy operational hours.
                </li>
                <li>
                  The Academy is not liable for incidents arising from students'
                  movements/activities outside the institution's premises, or personal
                  belongings/valuables misplaced within or outside institution
                  premises.
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                4. Academy Support System &amp; Communication{" "}
                <span className="text-gray-400 font-normal">
                  / உதவி மற்றும் தொடர்புகள்
                </span>
              </p>
              <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
                <li>Academic Doubts &amp; Mentorship: Assigned Core Faculty / Mentors</li>
                <li>Student Grievances &amp; Emergency Helpdesk: +91 93633 18665</li>
                <li>
                  Fees once remitted/paid to the academy are strictly Non-Refundable
                  and Non-Transferable under any circumstances, personal reasons, or
                  disciplinary dismissal.
                </li>
              </ul>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Joint Declaration & Undertaking / மாணவர் & பெற்றோர் அறிவிப்பு">
          <p className="text-sm text-gray-600 italic">
            "We hereby confirm that all information furnished in this registration
            profile is complete and accurate. We have thoroughly read, understood,
            and agreed to abide by the rules, code of conduct, campus safety
            regulations, and parental oversight policies established by Dr. A. D.
            Academy of Excellence."
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Student Signature
              </p>
              <input
                className={inputClass}
                placeholder="Type your full name to sign"
                value={profile.studentSignatureName}
                onChange={(e) => setField("studentSignatureName", e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={profile.studentAgreed}
                  onChange={(e) => setField("studentAgreed", e.target.checked)}
                />
                I agree to the declaration above.
              </label>
              {profile.studentAgreed && profile.studentSignedAt && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Signed {new Date(profile.studentSignedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Parent / Guardian Signature
              </p>
              <input
                className={inputClass}
                placeholder="Parent/Guardian types their full name to sign"
                value={profile.parentSignatureName}
                onChange={(e) => setField("parentSignatureName", e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={profile.parentAgreed}
                  onChange={(e) => setField("parentAgreed", e.target.checked)}
                />
                I (the parent/guardian) agree to the declaration above.
              </label>
              {profile.parentAgreed && profile.parentSignedAt && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Signed {new Date(profile.parentSignedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <PenLine className="h-3.5 w-3.5" />
            A typed full name here counts as a digital signature for this profile.
          </p>
        </SectionCard>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 px-6 rounded-xl disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default StudentProfilePage;
