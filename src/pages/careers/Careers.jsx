import React, { useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

const SUBJECT_OPTIONS = [
  "Structural Engineering",
  "Geotechnical Engineering",
  "Environmental Engineering",
  "Fluid Mechanics & Hydraulics",
  "Transportation Engineering",
  "Surveying",
  "Construction Materials & Management",
  "General Aptitude",
];

const INITIAL_FORM = {
  fullName: "",
  contactNumber: "",
  email: "",
  qualification: "",
  college: "",
  cgpa: "",
  resume: null,
  gateQualified: "no",
  gateScore: "",
  experience: "",
  subjects: [],
};

const Careers = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, resume: e.target.files?.[0] || null }));
  };

  const handleSubjectToggle = (subject) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.contactNumber.trim() || !form.email.trim()) {
      toast.error("Please fill in your name, contact number, and email.");
      return;
    }
    // TODO: no backend endpoint exists yet for career applications. Once
    // one is added (e.g. POST /api/career-applications, mirroring the
    // enrollment-leads pattern), wire this up the same way EnrollNowPopup
    // submits to /enrollment-leads, including the resume as a file upload.
    console.log("Career application (not yet submitted anywhere real):", form);
    toast.success("Thanks — we'll be in touch!");
    setSubmitted(true);
    setForm(INITIAL_FORM);
  };

  return (
    <div className="p-5">
      <Navbar />
      <div className="mt-5 max-w-2xl mx-auto py-16">
        <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
          Careers
        </span>
        <h1 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
          Join Dr. A.D. Academy of Excellence
        </h1>
        <p className="text-[15px] text-slate leading-relaxed mt-4 font-inter">
          We're always looking for passionate civil engineering educators to
          join our team. If you'd like to teach, mentor, or help build our
          test-series content, tell us a bit about yourself below.
        </p>

        {submitted && (
          <div className="mt-6 bg-cream border border-line rounded-lg p-4 text-sm text-ink font-inter">
            Thanks for applying — we've received your details and will reach
            out if there's a fit.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-8">
          <div>
            <label className="text-xs font-medium text-slate font-inter">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-slate font-inter">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate font-inter">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-slate font-inter">
                Highest Qualification
              </label>
              <input
                type="text"
                name="qualification"
                placeholder="e.g. M.E./M.Tech, B.E./B.Tech, Ph.D."
                value={form.qualification}
                onChange={handleChange}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate font-inter">
                College / University Attended
              </label>
              <input
                type="text"
                name="college"
                value={form.college}
                onChange={handleChange}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-slate font-inter">
                CGPA / Percentage
              </label>
              <input
                type="text"
                name="cgpa"
                value={form.cgpa}
                onChange={handleChange}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate font-inter">
                Upload Resume/CV
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm font-inter mt-1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate font-inter block mb-2">
              GATE Qualified?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-inter">
                <input
                  type="radio"
                  name="gateQualified"
                  value="yes"
                  checked={form.gateQualified === "yes"}
                  onChange={handleChange}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm font-inter">
                <input
                  type="radio"
                  name="gateQualified"
                  value="no"
                  checked={form.gateQualified === "no"}
                  onChange={handleChange}
                />
                No
              </label>
            </div>
            {form.gateQualified === "yes" && (
              <input
                type="text"
                name="gateScore"
                placeholder="GATE Score"
                value={form.gateScore}
                onChange={handleChange}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-3"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate font-inter">
              Relevant Teaching/Coaching Experience{" "}
              <span className="font-normal">
                (for TNPSC and other state/central exam roles)
              </span>
            </label>
            <textarea
              name="experience"
              rows={3}
              value={form.experience}
              onChange={handleChange}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate font-inter block mb-2">
              Subjects You Can Teach
            </label>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {SUBJECT_OPTIONS.map((subject) => (
                <label
                  key={subject}
                  className="flex items-center gap-2 text-sm font-inter"
                >
                  <input
                    type="checkbox"
                    checked={form.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                  />
                  {subject}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gold text-navy-dark rounded-full text-sm font-semibold hover:bg-gold-light transition-colors cursor-pointer"
          >
            Submit Application
          </button>
        </form>
      </div>
      <div className="mt-5">
        <Footer />
      </div>
    </div>
  );
};

export default Careers;
