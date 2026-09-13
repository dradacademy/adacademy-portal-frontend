import React, { useState } from "react";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { Phone, MessageCircle, PhoneCall } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axios";

const BATCHES = [
  "GATE Civil – Hybrid Batch (Both Online & Offline)",
  "TNPSC AE Civil – Regular Batch",
  "TNPSC JDO Civil – Regular Batch",
  "SSC JE & RRB JE Civil – Regular Batch",
];

const TARGET_EXAM_OPTIONS = [
  "GATE Civil",
  "TNPSC AE Civil",
  "TNPSC JDO Civil",
  "SSC JE / RRB JE Civil",
  "Not sure yet",
];

const INITIAL_FORM = { studentName: "", mobileNumber: "", targetExam: "" };
const INITIAL_CALLBACK_FORM = { studentName: "", mobileNumber: "" };

const EnrollNowPopup = ({ open, onClose }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [callbackForm, setCallbackForm] = useState(INITIAL_CALLBACK_FORM);
  const [callbackSubmitting, setCallbackSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCallbackChange = (e) => {
    const { name, value } = e.target;
    setCallbackForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.mobileNumber.trim() || !form.targetExam) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/enrollment-leads", {
        ...form,
        source: "enroll_form",
      });
      if (response.data.success) {
        toast.success(response.data.message || "Thanks! We'll reach out shortly.");
        setForm(INITIAL_FORM);
        onClose();
      } else {
        toast.error(response.data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error submitting enrollment lead:", error);
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please call or WhatsApp us directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallbackSubmit = async (e) => {
    e.preventDefault();
    if (!callbackForm.studentName.trim() || !callbackForm.mobileNumber.trim()) {
      toast.error("Please enter your name and mobile number.");
      return;
    }

    setCallbackSubmitting(true);
    try {
      const response = await api.post("/enrollment-leads", {
        ...callbackForm,
        source: "callback_request",
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Thanks! We'll call you back shortly."
        );
        setCallbackForm(INITIAL_CALLBACK_FORM);
        setShowCallbackForm(false);
        onClose();
      } else {
        toast.error(response.data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error submitting callback request:", error);
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please call or WhatsApp us directly."
      );
    } finally {
      setCallbackSubmitting(false);
    }
  };

  const handleClose = () => {
    // The popup is kept mounted by its parents (only `open` toggles), so
    // this component's state survives across open/close cycles unless we
    // reset it explicitly here — otherwise a half-typed name/number would
    // still be sitting in the form the next time someone opens it.
    setShowCallbackForm(false);
    setForm(INITIAL_FORM);
    setCallbackForm(INITIAL_CALLBACK_FORM);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-newsreader text-2xl sm:text-[26px] text-navy-dark">
              Thank You for Contacting Us!
            </h2>
            <p className="text-sm text-slate mt-2 font-inter leading-relaxed">
              For enrollment, fee details, and batch admissions, kindly reach
              out directly to our admissions team at{" "}
              <a
                href="tel:+919566818665"
                className="text-navy font-medium hover:underline"
              >
                +91 95668 18665
              </a>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="cursor-pointer flex-shrink-0"
          >
            <MdClose className="text-slate text-3xl hover:opacity-70 transition-opacity" />
          </button>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-wide uppercase text-gold font-inter mb-3">
            Batches Offered
          </h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {BATCHES.map((batch) => (
              <div
                key={batch}
                className="bg-cream border border-line rounded-lg px-3.5 py-2.5 text-[13px] text-ink font-inter leading-snug"
              >
                {batch}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+919566818665"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-navy text-white rounded-full text-sm font-medium hover:bg-navy-dark transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Us Now
          </a>
          <a
            href="https://wa.me/919566818665"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Inquiry
          </a>
        </div>

        {!showCallbackForm ? (
          <button
            type="button"
            onClick={() => setShowCallbackForm(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gold text-navy-dark rounded-full text-sm font-medium hover:bg-gold/10 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            Request a Callback
          </button>
        ) : (
          <div className="border border-line rounded-lg p-4 bg-cream/60">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-gold font-inter mb-3">
              Request a Callback
            </h3>
            <form onSubmit={handleCallbackSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                name="studentName"
                value={callbackForm.studentName}
                onChange={handleCallbackChange}
                placeholder="Your Name"
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors bg-white"
              />
              <input
                type="tel"
                name="mobileNumber"
                value={callbackForm.mobileNumber}
                onChange={handleCallbackChange}
                placeholder="Mobile Number"
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors bg-white"
              />
              <div className="flex gap-2.5">
                <button
                  type="submit"
                  disabled={callbackSubmitting}
                  className="flex-1 py-2.5 px-4 bg-gold text-navy-dark rounded-full text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {callbackSubmitting ? "Requesting..." : "Request Callback"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCallbackForm(false)}
                  className="py-2.5 px-4 text-slate text-sm font-medium hover:text-navy-dark transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="border-t border-line pt-5">
          <h3 className="text-xs font-semibold tracking-wide uppercase text-gold font-inter mb-3">
            Or Tell Us What You're Preparing For
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              name="studentName"
              value={form.studentName}
              onChange={handleChange}
              placeholder="Student Name"
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors"
            />
            <input
              type="tel"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              placeholder="Mobile Number"
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors"
            />
            <select
              name="targetExam"
              value={form.targetExam}
              onChange={handleChange}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm font-inter outline-none focus:border-navy transition-colors text-ink bg-white"
            >
              <option value="" disabled>
                Select Target Exam
              </option>
              {TARGET_EXAM_OPTIONS.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-gold text-navy-dark rounded-full text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default EnrollNowPopup;
