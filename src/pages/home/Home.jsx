import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import PromoBannerCarousel from "../../components/home/PromoBannerCarousel";
import HeroSectionHome from "../../components/home/HeroSectionHome";
import TrackRecord from "../../components/home/TrackRecord";
import Courses from "../../components/home/Courses";
import TestSeries from "../../components/home/TestSeries";
import WhatYouGet from "../../components/home/WhatYouGet";
import AboutFounder from "../../components/home/AboutFounder";
import HowItWorks from "../../components/home/HowItWorks";
import Achievers from "../../components/home/Achievers";
import Testimonials from "../../components/home/Testimonials";
import Gallery from "../../components/home/Gallery";
import Announcements from "../../components/home/Announcements";
import FreeResources from "../../components/home/FreeResources";
import FAQ from "../../components/home/FAQ";
import Contact from "../../components/home/Contact";
import FollowUs from "../../components/home/FollowUs";
import CTA from "../../components/home/CTA";
import PopularVideos from "../../components/home/PopularVideos";
import ShowcaseVideos from "../../components/home/ShowcaseVideos";

const Home = () => {
  return (
    <div className=" p-5">
      <Navbar />
      <div className="flex flex-col gap-6 mt-5">
        <PromoBannerCarousel />
        <HeroSectionHome />
        <TrackRecord />
        {/* "Inside our classroom": how classes are handled + student testimonials (2026-10-30). */}
        <ShowcaseVideos />
        {/* Most-watched YouTube videos, picked automatically (2026-10-30). */}
        <PopularVideos />
        <Courses />
        <TestSeries />
        <WhatYouGet />
        <AboutFounder />
        <HowItWorks />
        <Achievers />
        <Testimonials />
        <Gallery />
        <Announcements />
        <FreeResources />
        <FAQ />
        <Contact />
        <FollowUs />
        <CTA />
      </div>
      <div className="mt-5">
        <Footer />
      </div>
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
