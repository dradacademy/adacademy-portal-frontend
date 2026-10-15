import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

// Public "Free Test" registration page (/free-test). Anyone can register
// for the one free test the admin has marked for their target exam
// (backend: controllers/freeTestController.js). Registering creates a
// "free_trial" student account and signs the visitor in straight away, so
// they land on their Activities page ready to take the test.

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  city: "",
  category: "",
  qualification: "",
  college: "",
  passingYear: "",
  currentStatus: "",
  heardFrom: "",
  password: "",
  confirmPassword: "",
  consent: false,
};

const STATUS_OPTIONS = [
  "Final-year student",
  "Graduate — preparing full time",
  "Working professional",
  "Other",
];

const HEARD_FROM_OPTIONS = [
  "Friend / senior",
  "Instagram",
  "YouTube",
  "Telegram / WhatsApp",
  "Google search",
  "College",
  "Other",
];

const inputCls =
  "w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors mt-1.5 bg-white";
const labelCls = "text-xs font-medium text-slate font-inter";

const FreeTestPage = () => {
  const navigate = useNavigate();
  const { userData, loginWithToken } = useContext(AuthContext);
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get("/free-test/options")
      .then(({ data }) => {
        if (alive) setOptions(data?.data || []);
      })
      .catch(() => {
        if (alive) toast.error("Couldn't load the free tests. Please refresh the page.");
      })
      .finally(() => {
        if (alive) setOptionsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  };

  const selected = options.find((o) => o.category === form.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error("Please choose your target exam.");
    if (selected && !selected.available) {
      return toast.error("The free test for this exam is not open yet.");
    }
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match.");
    if (!form.consent) return toast.error("Please agree to be contacted by the academy.");

    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      const { data } = await api.post("/free-test/register", payload);
      loginWithToken(data.token, data.user);
      toast.success("Registered! Your free test is ready.");
      navigate("/activities");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const alreadyFree = userData?.accountType === "free_trial";
  const loggedInOther = userData && !alreadyFree;

  return (
    <div className="p-5">
      <Navbar />
      <div className="mt-5 max-w-2xl mx-auto py-16">
        <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
          Free Test
        </span>
        <h1 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
          Take a free test with Dr. A.D. Academy
        </h1>
        <p className="text-[15px] text-slate leading-relaxed mt-4 font-inter">
          Register below to attempt one free test for your target exam. After
          you submit it, you'll see your score, your rank among everyone who
          took it, and full step-by-step solutions.
        </p>

        {alreadyFree || loggedInOther ? (
          <div className="mt-8 bg-cream border border-line rounded-lg p-5 font-inter">
            <p className="text-sm text-ink">
              {alreadyFree
                ? `You're already registered as ${userData.username || userData.email}.`
                : "You're already signed in to the academy portal."}
            </p>
            <Link
              to="/activities"
              className="inline-block mt-4 bg-navy text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:opacity-90"
            >
              {alreadyFree ? "Go to my free test" : "Go to my tests"}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-8">
            <div>
              <label className={labelCls}>Target exam</label>
              {optionsLoading ? (
                <p className="text-sm text-slate mt-2 font-inter">Loading…</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 mt-1.5">
                  {options.map((o) => {
                    const active = form.category === o.category;
                    return (
                      <button
                        key={o.category}
                        type="button"
                        disabled={!o.available}
                        onClick={() => set("category", o.category)}
                        className={`text-left border rounded-lg px-3.5 py-3 font-inter transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          active ? "border-navy bg-cream" : "border-line bg-white hover:border-navy"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-ink">{o.label}</span>
                        <span className="block text-xs text-slate mt-0.5">
                          {o.available
                            ? `${o.title || "Free test"}${o.questionCount ? ` · ${o.questionCount} questions` : ""}`
                            : "Opening soon"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Full name</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputCls} />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mobile number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required inputMode="tel" className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>City</label>
                <input name="city" value={form.city} onChange={handleChange} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Highest qualification (optional)</label>
                <input name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. B.E. Civil" className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>College (optional)</label>
                <input name="college" value={form.college} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Year of passing (optional)</label>
                <input name="passingYear" value={form.passingYear} onChange={handleChange} inputMode="numeric" className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Current status (optional)</label>
                <select name="currentStatus" value={form.currentStatus} onChange={handleChange} className={inputCls}>
                  <option value="">Select…</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>How did you hear about us? (optional)</label>
                <select name="heardFrom" value={form.heardFrom} onChange={handleChange} className={inputCls}>
                  <option value="">Select…</option>
                  {HEARD_FROM_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Create a password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} autoComplete="new-password" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirm password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-slate font-inter -mt-3">
              Use this email and password to log in later and review your result.
            </p>

            <label className="flex items-start gap-2.5 text-sm text-ink font-inter cursor-pointer">
              <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} className="mt-1" />
              I agree to be contacted by Dr. A.D. Academy of Excellence about my
              result and its courses.
            </label>

            <button
              type="submit"
              disabled={submitting || optionsLoading}
              className="bg-navy text-white text-sm font-medium py-3 rounded-lg hover:opacity-90 disabled:opacity-50 font-inter"
            >
              {submitting ? "Registering…" : "Register & start my free test"}
            </button>

            <p className="text-xs text-slate font-inter text-center">
              Already registered?{" "}
              <Link to="/login" className="text-navy font-medium underline">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FreeTestPage;
