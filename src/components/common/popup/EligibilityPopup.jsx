import { Info, Sparkles } from "lucide-react";
import React, { useContext } from "react";
import { DurationContext } from "../../../context/DurationContext";

const enterFullScreenMode = () => {
  const elem = document.documentElement; // or a specific div
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    // Firefox
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    // Chrome, Safari, Opera
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    // IE/Edge
    elem.msRequestFullscreen();
  }
};

const EligibilityPopup = ({
  subjectName,
  subtopicName,
  level,
  passPercentage,
  questionLength,
  setOpenEligibilityPopup,
}) => {
  const { durationData } = useContext(DurationContext);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 mx-4">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-center mb-2 font-poppins">
          Exam Instructions
        </h3>
        <div className="text-gray-600 bg-gray-50 my-2 p-3 rounded space-y-2 text-[15px] font-inter">
          <p>
            You are about to start the {subjectName} exam on {subtopicName}.
          </p>
          <p>
            You have{" "}
            {`${Math.floor(
              (questionLength *
                (level === 1
                  ? durationData.level1Duration
                  : level === 2
                  ? durationData.level2Duration
                  : level === 3
                  ? durationData.level3Duration
                  : durationData.level4Duration)) /
                60
            )} Minutes ${
              (questionLength *
                (level === 1
                  ? durationData.level1Duration
                  : level === 2
                  ? durationData.level2Duration
                  : level === 3
                  ? durationData.level3Duration
                  : durationData.level4Duration)) %
              60
            } Seconds`}{" "}
            to complete {questionLength} questions.
          </p>
          <p>The passing percentage is {passPercentage}%.</p>
        </div>
        <p className="text-sm text-amber-600 font-medium mb-5 font-poppins">
          Note: The timer will start once you click "Start Exam".
        </p>
        <div className="flex justify-center font-inter">
          <button
            onClick={() => {
              enterFullScreenMode();
              setOpenEligibilityPopup(false);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default EligibilityPopup;
