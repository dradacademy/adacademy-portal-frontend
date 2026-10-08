import React from "react";
import { Dialog } from "@mui/material";
import { Link } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { Layers, Settings2, Building2, ClipboardList, ArrowRight } from "lucide-react";

// Every portal card opens THIS site's own /login page (same address the
// student is already on). It used to go through the backend's /portal/<key>
// redirect, which sent students to whatever CLIENT_URL Railway had —
// historically the old adacademy-portal-frontend.vercel.app address. A login
// is stored per website address, so students who signed in there looked
// "logged out" whenever they opened www.dradacademy.com or the Play Store app.
// Keeping the login on one address fixes that. (All exam categories share the
// same login today; the category is on the student's account.)

const PORTALS = [
  {
    key: "gate",
    icon: Layers,
    title: "GATE Civil",
    description: "Online Test Portal",
  },
  {
    key: "tnpsc-ae",
    icon: Settings2,
    title: "TNPSC AE Civil",
    description: "Online Test Portal",
  },
  {
    key: "tnpsc-jdo",
    icon: Building2,
    title: "TNPSC JDO Civil",
    description: "Online Test Portal",
  },
  {
    key: "ssc-rrb-je",
    icon: ClipboardList,
    title: "SSC JE & RRB JE Civil",
    description: "Online Test Portal",
  },
];

const PortalSelectorPopup = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-newsreader text-2xl sm:text-[26px] text-navy-dark">
              Choose Your Test Portal
            </h2>
            <p className="text-sm text-slate mt-1.5 font-inter">
              Select your exam to continue to its test portal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer flex-shrink-0"
          >
            <MdClose className="text-slate text-3xl hover:opacity-70 transition-opacity" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {PORTALS.map(({ key, icon: Icon, title, description }) => (
            <Link
              key={key}
              to="/login"
              state={{ portal: key }}
              onClick={onClose}
              className="group flex items-center gap-3.5 border border-line rounded-xl p-4 hover:border-gold hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-lg bg-navy/[0.08] flex items-center justify-center flex-shrink-0">
                <Icon className="w-[22px] h-[22px] text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy-dark font-inter">
                  {title}
                </div>
                <div className="text-xs text-slate font-inter">{description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate group-hover:text-gold group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>

        <div className="border-t border-line pt-4 text-center">
          <p className="text-xs text-slate font-inter">
            Staff or Evaluator?{" "}
            <Link
              to="/login"
              onClick={onClose}
              className="text-navy font-medium hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </Dialog>
  );
};

export default PortalSelectorPopup;
