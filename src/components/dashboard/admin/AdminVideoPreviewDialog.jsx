import React from "react";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { ExternalLink } from "lucide-react";

// Admin-only "View" player for Live Class and Recorded Classes. Plays the
// YouTube video (or the live stream, while it's live) directly with the
// standard embed — deliberately NOT the student player, so an admin
// watching here never records watch-time/attendance against themselves.
const AdminVideoPreviewDialog = ({ open, onClose, videoId, title, subtitle }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div className="flex flex-col gap-4 p-4 sm:p-5 font-inter">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-700 font-poppins truncate">
              {title || "Video"}
            </h2>
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          <MdClose
            onClick={onClose}
            className="text-stone-500 text-3xl cursor-pointer hover:opacity-80 duration-300 shrink-0"
          />
        </div>

        {open && videoId ? (
          <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              key={videoId}
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title={title || "Class video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="text-sm text-stone-500 py-10 text-center">No video link saved for this entry.</p>
        )}

        {videoId && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
            <span>
              If it says "video unavailable", YouTube may still be processing it (common for a few
              minutes after a live stream ends), or the link needs fixing via Edit.
            </span>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-600 font-medium hover:underline shrink-0"
            >
              Open on YouTube <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default AdminVideoPreviewDialog;
