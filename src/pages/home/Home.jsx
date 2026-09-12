import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import LandingStatistics from "../../components/home/LandingStatistics";
import HeroSectionHome from "../../components/home/HeroSectionHome";
import HowItWorks from "../../components/home/HowItWorks";
import AvailableSubjectHome from "../../components/home/AvailableSubjectHome";
import Guidelines from "../../components/home/Guidelines";
import FAQ from "../../components/home/FAQ";
import CTA from "../../components/home/CTA";

const Home = () => {
  return (
    <div className=" p-5">
      <Navbar />
      <div>
        <HeroSectionHome />
        <HowItWorks />
        <AvailableSubjectHome />
        <LandingStatistics />
        <Guidelines />
        <FAQ />
        <CTA />
      </div>
      <Footer />
    </div>
  );
};

export default Home;
