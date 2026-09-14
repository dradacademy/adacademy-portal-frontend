import React, { useState } from "react";
import { MapPin, Phone, MessageCircle, Mail, Clock } from "lucide-react";
import EnrollNowPopup from "../common/popup/EnrollNowPopup";

const ADDRESS = "9/1, Poonthotam Nagar, Saravanampatti, Coimbatore, Tamil Nadu";
const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(
  ADDRESS,
)}&output=embed`;

const Contact = () => {
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  return (
    <section id="contact" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Contact
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Get in touch with the academy.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-12">
          <div className="bg-white rounded-xl border border-line p-7 flex flex-col gap-5">
            <div className="flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
              <span className="text-[14.5px] text-ink font-inter">
                {ADDRESS}
              </span>
            </div>
            <a
              href="tel:+919566818665"
              className="flex items-center gap-3.5 text-[14.5px] text-ink font-inter hover:text-navy transition-colors"
            >
              <Phone className="w-5 h-5 text-gold flex-shrink-0" />
              +91 95668 18665
            </a>
            <a
              href="https://wa.me/919566818665"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 text-[14.5px] text-ink font-inter hover:text-navy transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-gold flex-shrink-0" />
              WhatsApp: +91 95668 18665
            </a>
            <a
              href="mailto:dradacademy@gmail.com"
              className="flex items-center gap-3.5 text-[14.5px] text-ink font-inter hover:text-navy transition-colors"
            >
              <Mail className="w-5 h-5 text-gold flex-shrink-0" />
              dradacademy@gmail.com
            </a>
            <div className="flex items-center gap-3.5 text-[14.5px] text-ink font-inter">
              <Clock className="w-5 h-5 text-gold flex-shrink-0" />
              Monday to Sunday, 09:00 AM – 07:00 PM
            </div>
            <button
              type="button"
              onClick={() => setShowEnrollModal(true)}
              className="mt-2 px-6 py-3 bg-gold text-navy-dark rounded-full font-semibold hover:bg-gold-light transition-colors cursor-pointer self-start"
            >
              Contact Us
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border border-line min-h-[320px]">
            <iframe
              title="Academy location"
              src={MAP_SRC}
              className="w-full h-full min-h-[320px]"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
      <EnrollNowPopup
        open={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
      />
    </section>
  );
};

export default Contact;
