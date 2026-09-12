import React from "react";
import {
  BookOpen,
  Award,
  Users,
  ChevronRight,
  CheckCircle,
  BarChart3,
  FileText,
  Clock,
} from "lucide-react";

const LandingStatistics = () => {
  return (
    <section className="relative py-8 sm:py-12 lg:py-16 bg-blue-50 mt-5 rounded-xl mx-4 sm:mx-0">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-first grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Platform Flow - Full width on mobile, spans 3 cols on desktop */}
            <div className="lg:col-span-3 order-1">
              <PlatformFlow />
            </div>

            {/* Stats Overview - Repositioned for better mobile flow */}
            <div className="order-2 lg:order-2">
              <StatsOverview />
            </div>

            {/* Main Stats - Spans 2 cols on desktop, full width on mobile */}
            <div className="lg:col-span-2 lg:row-span-2 order-3">
              <Stats />
            </div>

            {/* Recent Activity - Spans 2 cols, repositioned */}
            <div className="lg:col-span-2 order-4">
              <RecentActivity />
            </div>

            {/* CTA - Spans 2 cols, last on mobile */}
            <div className="lg:col-span-2 order-5">
              <StatsCTA />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingStatistics;

const StatsOverview = () => {
  return (
    <div className="relative bg-blue-600 text-white px-4 sm:px-6 py-4 sm:py-5 rounded-xl flex flex-col gap-2 justify-center items-center text-center shadow-lg overflow-hidden min-h-[160px] sm:min-h-[180px] h-full">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
          <path
            d="M50 150 Q100 50 150 150"
            stroke="white"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 z-10">
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 15.75L5.25 12m0 0l4.5-3.75m-4.5 3.75h13.5M14.25 9.75L18.75 12m0 0l-4.5 3.75"
          />
        </svg>
        <h2 className="font-black text-lg sm:text-xl lg:text-2xl uppercase text-center sm:text-right">
          Stats Overview
        </h2>
      </div>
      <p className="text-xs sm:text-sm font-medium text-white/90 text-center sm:text-right z-10 xl:pl-5 2xl:pl-12 w-full">
        Your journey, your progress! Stay on top of your achievements.
      </p>
    </div>
  );
};

const Stats = () => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm h-full">
      <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-900">
        Platform Statistics
      </h3>

      {/* Responsive grid for stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {[
          {
            value: "500+",
            label: "Practice Exams",
            icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />,
          },
          {
            value: "50+",
            label: "Academy Courses",
            icon: <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />,
          },
          {
            value: "25+",
            label: "Expert Instructors",
            icon: <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />,
          },
          {
            value: "1,000+",
            label: "Academy Students",
            icon: <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="p-2 sm:p-3 bg-white rounded-full mb-2 sm:mb-3 shadow-sm">
              {stat.icon}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecentActivity = () => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
          Recent Activity
        </h3>
        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
      </div>

      <div className="space-y-3">
        {[
          {
            action: "Level 3 Assessment completed",
            time: "2 hours ago",
          },
          {
            action: "New feedback received",
            time: "1 day ago",
          },
          {
            action: "Badge earned: Perfect Score",
            time: "3 days ago",
          },
        ].map((activity, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="min-w-[8px] h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 break-words">
                {activity.action}
              </div>
              <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatsCTA = () => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">
            Ready to improve your scores?
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Join your classmates who are already using the platform.
          </p>
        </div>

        <div className="flex justify-center sm:justify-start">
          <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

const PlatformFlow = () => {
  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-900">
        Exam Platform Flow
      </h3>

      <div className="relative">
        {/* Desktop connecting line */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 z-0"></div>

        {/* Responsive grid for flow steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 relative z-10">
          {[
            {
              label: "Login",
              icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
            },
            {
              label: "Select Exam",
              icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
            },
            {
              label: "Take Assessment",
              icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
            },
            {
              label: "Review Results",
              icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />,
            },
            {
              label: "Track Progress",
              icon: <Award className="h-4 w-4 sm:h-5 sm:w-5" />,
            },
          ].map((step, index) => (
            <div key={index} className="flex flex-col items-center relative">
              {/* Step circle */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center mb-3 z-10 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  {step.icon}
                </div>
              </div>

              {/* Step label */}
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center px-2">
                {step.label}
              </span>

              {/* Mobile arrow (between steps) */}
              {index < 4 && (
                <div className="sm:hidden flex justify-center mt-2 mb-2">
                  <ChevronRight className="h-4 w-4 text-blue-600 transform rotate-90" />
                </div>
              )}

              {/* Desktop arrow */}
              {index < 4 && (
                <div className="hidden lg:block absolute top-8 -right-4 transform -translate-y-1/2 z-20">
                  <ChevronRight className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
