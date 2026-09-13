import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import HeroSectionHome from "../../components/home/HeroSectionHome";
import TrackRecord from "../../components/home/TrackRecord";
import ExamsWeCover from "../../components/home/ExamsWeCover";
import TestSeries from "../../components/home/TestSeries";
import WhatYouGet from "../../components/home/WhatYouGet";
import AboutFounder from "../../components/home/AboutFounder";
import HowItWorks from "../../components/home/HowItWorks";
import FAQ from "../../components/home/FAQ";
import Achievers from "../../components/home/Achievers";
import FollowUs from "../../components/home/FollowUs";
import CTA from "../../components/home/CTA";

const Home = () => {
  return (
    <div className=" p-5">
      <Navbar />
      <div className="flex flex-col gap-6 mt-5">
        <HeroSectionHome />
        <TrackRecord />
        <ExamsWeCover />
        <TestSeries />
        <WhatYouGet />
        <AboutFounder />
        <HowItWorks />
        <FAQ />
        <Achievers />
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
