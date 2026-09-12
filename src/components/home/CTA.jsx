import React from "react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-b from-blue-700 to-blue-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4 font-poppins">
              Ready to Improve Your Exam Performance?
            </h2>
            <p className="mb-8 text-blue-100 max-w-2xl mx-auto font-inter">
              Access your academy's specialized exam platform and start tracking
              your progress today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center font-inter">
              <Link to={"/login"} className="px-6 py-3 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors">
                Sign In Now
              </Link>
              <button className="px-6 py-3 bg-transparent border border-white text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
