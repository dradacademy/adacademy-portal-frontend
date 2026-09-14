import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
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

const Home = () => {
  return (
    <div className=" p-5">
      <Navbar />
      <div className="flex flex-col gap-6 mt-5">
        <HeroSectionHome />
        <TrackRecord />
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
    </div>
  );
};

export default Home;
