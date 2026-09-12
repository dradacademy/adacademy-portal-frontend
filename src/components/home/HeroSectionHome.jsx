import React from "react";
import {
  BookOpen,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Trophy,
  Medal,
  Clock,
} from "lucide-react";

const HeroSectionHome = () => {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-50 rounded-bl-full opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-teal-50 rounded-tr-full opacity-70"></div>
      <div className="container mx-auto px-4 relative">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold font-manrope text-blue-700">
              Academy Student Portal
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 font-poppins">
              Master Your Exams With Confidence
            </h1>
            <p className="text-lg text-gray-600 max-w-md font-inter">
              A specialized platform for academy students to take practice
              exams, receive feedback, and track progress.
            </p>
            <div className="flex flex-wrap gap-4 font-inter">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium transition-colors hover:bg-blue-700 flex items-center">
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button className="px-6 py-3 border border-gray-300 rounded-full font-medium transition-colors hover:bg-gray-50">
                View Exams
              </button>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 font-inter">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-teal-400 border-2 border-white flex items-center justify-center text-white text-xs"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Academy students</span> are
                already improving their scores
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 font-inter">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Assessment</h3>
                      <p className="text-xs text-gray-500">Level 3 Quiz</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      25:00
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 font-inter">
                      What is the value of x in the equation 2x + 5 = 15?
                    </p>
                    <div className="mt-3 space-y-2 font-rubik">
                      {["x = 5", "x = 10", "x = 7", "x = 3"].map(
                        (option, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-2 rounded-md ${
                              i === 0
                                ? "bg-blue-50 border border-blue-100"
                                : "hover:bg-gray-100"
                            } cursor-pointer transition-colors`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                i === 0
                                  ? "bg-blue-600 border-blue-600"
                                  : "border border-gray-300"
                              }`}
                            >
                              {i === 0 && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Question 3 of 10</span>
                      <span>30% Complete</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: "30%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <button className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                      Next Question
                    </button>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>2 Correct</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span>80% Accuracy</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span>120 Points</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center">
              <Medal className="h-8 w-8 text-amber-500" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionHome;
