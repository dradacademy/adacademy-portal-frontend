import React from "react";
import {
  CheckCircle,
  BarChart3,
  Trophy,
  Clock,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";

const Guidelines = () => {
  return (
    <section id="guidelines" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 font-poppins">
            Exam Guidelines & Rules
          </h2>
          <p className="text-gray-600 font-inter">
            Important information to help you navigate the platform and succeed
            in your assessments.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto font-inter">
          <div className="md:col-span-2 bg-blue-600 rounded-2xl p-8 text-white shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white text-blue-600 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold font-poppins">
                Before You Begin
              </h3>
            </div>
            <p className="mb-6 text-blue-100">
              Follow these key guidelines to ensure a smooth exam experience and
              maximize your performance.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Ensure you have a stable internet connection",
                "Allocate sufficient time without interruptions",
                "Have necessary materials ready",
                "Review previous feedback from instructors",
                "Check exam duration and question count",
                "Find a quiet place to concentrate",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="min-w-4 h-4 rounded-full bg-white mt-1.5"></div>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-poppins">
                Time Management
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                "Read each question carefully",
                "Don't spend too long on difficult questions",
                "Leave time to review your answers",
                "Watch the timer at the top of the screen",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="min-w-4 h-4 rounded-full bg-blue-600 mt-1.5"></div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Average completion time
                </span>
                <span className="text-sm font-medium">45 minutes</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-3 bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Zap className="h-8 w-8" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold font-poppins mb-2 text-gray-900">
                  Quick Tips for Success
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                  {[
                    "Review all material before the exam",
                    "Take practice tests to build confidence",
                    "Get a good night's sleep before the exam",
                    "Stay hydrated during the assessment",
                    "Use the flag feature for difficult questions",
                    "Double-check your answers before submitting",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-poppins">
                Academic Integrity
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                "Complete your own work without assistance",
                "Don't share exam content with others",
                "Cite sources when required",
                "Follow all academy guidelines",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="min-w-4 h-4 rounded-full bg-blue-600 mt-1.5"></div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-poppins">
                After Completion
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                'Review your results thoroughly",ts thoroughly',
                "Read instructor feedback carefully",
                "Track your progress in the dashboard",
                "Retake practice exams as needed",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="min-w-4 h-4 rounded-full bg-blue-600 mt-1.5"></div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-poppins">
                Achievements & Rewards
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                "Earn badges for completing exams",
                "Track your position on the leaderboard",
                "Unlock special recognition for improvement",
                "Receive certificates for mastery",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="min-w-4 h-4 rounded-full bg-blue-600 mt-1.5"></div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Guidelines;
