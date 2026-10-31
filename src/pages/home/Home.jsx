import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import PromoBannerCarousel from "../../components/home/PromoBannerCarousel";
import AboutFounder from "../../components/home/AboutFounder";
import Achievers from "../../components/home/Achievers";
import Testimonials from "../../components/home/Testimonials";
import Gallery from "../../components/home/Gallery";
import Announcements from "../../components/home/Announcements";
import FAQ from "../../components/home/FAQ";
import Contact from "../../components/home/Contact";
import PopularVideos from "../../components/home/PopularVideos";
import ShowcaseVideos from "../../components/home/ShowcaseVideos";
import {
  HeroNew,
  ExamStrip,
  ProblemSection,
  SelfCheck,
  ResultsStats,
  CoursesNew,
  WhatYouGetNew,
  BatchesSection,
  StepsSection,
  FinalCTA,
  useReserve,
} from "../../components/home/landing/Landing";

// Front page — 2026-10-30 new design (approved mock-up). The story order:
// hero + countdown → exams → the problem → self-check → results →
// achievers → classroom & testimonial videos → courses → what you get →
// mentor → free classes → batches → how to join → gallery, updates, FAQ,
// contact → final call to action. Every "Reserve my seat" opens the same
// enquiry popup as before.

const Home = () => {
  const [reserve, reservePopup] = useReserve();
  return (
    <div className="p-3 sm:p-5">
      <Navbar />
      <div className="flex flex-col gap-6 mt-5">
        {/* Order set by Dr. Dinesh (2026-10-31): achievers banner first,
            then exams, hero, student stories, your own videos, the rest. */}
        <PromoBannerCarousel />
        <ExamStrip />
        <HeroNew onReserve={reserve} />
        <ShowcaseVideos kind="students" />
        <Testimonials />
        <ShowcaseVideos kind="teacher" />
        <PopularVideos />
        <ResultsStats />
        <Achievers />
        <ProblemSection />
        <SelfCheck />
        <CoursesNew />
        <WhatYouGetNew />
        <BatchesSection onReserve={reserve} />
        <StepsSection />
        <AboutFounder />
        <Gallery />
        <Announcements />
        <FAQ />
        <Contact />
        <FinalCTA onReserve={reserve} />
      </div>
      <div className="mt-5">
        <Footer />
      </div>
      {reservePopup}
      {/* Floating WhatsApp button (2026-10-30). */}
      <a
        href="https://wa.me/919566818665?text=Hi%2C%20I%20would%20like%20to%20know%20about%20the%20courses%20at%20Dr.%20A.D.%20Academy"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed z-40 right-4 bottom-4 sm:right-6 sm:bottom-6 flex items-center gap-2 rounded-full shadow-xl px-4 py-3 text-white font-semibold"
        style={{ backgroundColor: "#25D366" }}
      >
        <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.6l-.4-.2-3.8 1.2 1.2-3.7-.3-.4c-1.1-1.7-1.7-3.8-1.7-5.9C5.1 9.9 10 5.1 16 5.1S26.9 9.9 26.9 15.8 22 26.4 16 26.4zm6-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.8 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.2-.6-.4z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp us</span>
      </a>
    </div>
  );
};

export default Home;
