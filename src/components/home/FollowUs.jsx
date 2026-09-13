import React from "react";
import qrInstagram from "../../assets/images/home/qr-instagram.png";
import qrTelegram from "../../assets/images/home/qr-telegram.png";
import qrYoutube from "../../assets/images/home/qr-youtube.png";

const CHANNELS = [
  {
    qr: qrInstagram,
    alt: "Instagram QR code",
    name: "Instagram",
    detail: "@dradacademy",
  },
  {
    qr: qrTelegram,
    alt: "Telegram QR code",
    name: "Telegram",
    detail: "Daily updates & doubt support",
  },
  {
    qr: qrYoutube,
    alt: "YouTube QR code",
    name: "YouTube",
    detail: "@DrADAcademy",
  },
];

const FollowUs = () => {
  return (
    <section id="connect" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4 text-center">
        <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
          Stay Connected
        </span>
        <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3">
          Scan to follow along, wherever you are.
        </h2>
        <p className="text-[15px] text-slate mt-2.5 max-w-lg mx-auto font-inter">
          Daily practice tips, exam updates, and mentorship content across our
          channels.
        </p>
        <div className="flex flex-wrap justify-center gap-7 mt-11">
          {CHANNELS.map(({ qr, alt, name, detail }) => (
            <div
              key={name}
              className="w-[216px] text-center bg-white rounded-xl border border-line shadow-sm px-5 py-6"
            >
              <img
                src={qr}
                alt={alt}
                className="w-[150px] h-[150px] rounded-lg border border-line mx-auto"
              />
              <p className="text-[14.5px] font-semibold text-navy-dark mt-4 font-inter">
                {name}
              </p>
              <p className="text-xs text-slate mt-0.5 font-inter">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FollowUs;
