import React from "react";
import {
  ArrowRight,
  CheckCircle,
  BarChart3,
  FileText,
  Trophy,
  Zap,
  HelpCircle,
} from "lucide-react";

const FAQ = () => {
  return (
    <section id="faq" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 font-poppins">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 font-inter">
            Find answers to common questions about our academy's exam platform.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: "How do I access my assigned exams?",
                answer:
                  "After logging in with your academy credentials, navigate to the 'My Exams' section where you'll find all assessments assigned to you by your instructors.",
                icon: <FileText />,
              },

              {
                question: "How are my exams evaluated?",
                answer:
                  "Multiple-choice questions are graded automatically, while essay or open-ended questions are reviewed by your academy instructors with detailed feedback.",
                icon: <CheckCircle />,
              },
              {
                question: "Can I retake an exam to improve my score?",
                answer:
                  "This depends on your instructor's settings. Some practice exams allow unlimited retakes, while formal assessments may have restrictions.",
                icon: <ArrowRight />,
              },
              {
                question: "How do I track my progress over time?",
                answer:
                  "Visit your personal dashboard to view performance analytics across all subjects with progress charts and strength/weakness analyses.",
                icon: <BarChart3 />,
              },
              {
                question: "What do the badges and achievements mean?",
                answer:
                  "Badges are awarded for various accomplishments, such as completing exam streaks, achieving perfect scores, or showing significant improvement.",
                icon: <Trophy />,
              },
              {
                question:
                  "What happens if I lose internet connection during an exam?",
                answer:
                  "Our system automatically saves your answers every 30 seconds. If you lose connection, you can log back in and continue from where you left off.",
                icon: <Zap />,
              },
            ].map((faq, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full transition-all duration-300 hover:shadow p-6">
                  <div className="flex items-start gap-4 h-full">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                      {faq.icon}
                    </div>
                    <div className="h-full flex flex-col gap-3 justify-between">
                      <h3 className="text-lg font-black text-gray-900 font-manrope">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 row-span-2 font-rubik">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-blue-600">
                  <HelpCircle className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-4">
                  If you couldn't find the answer you were looking for, our
                  support team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                    Contact Support
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                    View Help Center
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
