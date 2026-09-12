import React from "react";
import { CheckCircle, BarChart3, FileText } from "lucide-react";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 font-poppins">
            How Our Platform Works
          </h2>
          <p className="text-gray-600 font-inter">
            A simple three-step process designed specifically for academy
            students.
          </p>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 z-0"></div>
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                step: "01",
                title: "Select Your Exam",
                description:
                  "Choose from exams assigned by your academy instructors based on your current courses.",
                icon: <FileText className="h-6 w-6 text-blue-600" />,
              },
              {
                step: "02",
                title: "Complete the Assessment",
                description:
                  "Answer questions within the time limit and submit your responses for evaluation.",
                icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
              },
              {
                step: "03",
                title: "Review & Improve",
                description:
                  "Receive detailed feedback from your instructors and track your progress over time.",
                icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
              },
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="absolute -top-5 left-6 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold font-manrope">
                    {step.step}
                  </div>
                  <div className="pt-6 space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg w-fit">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 font-inter">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 font-inter">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
