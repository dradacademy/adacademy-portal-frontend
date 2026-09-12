import React from 'react';
import { Clock } from 'lucide-react';

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Memoized timer component to prevent re-rendering entire exam page
const TimerDisplay = React.memo(({ timeLeft }) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        timeLeft < 120
          ? "bg-red-50 text-red-600"
          : "bg-blue-50 text-blue-600"
      }`}
    >
      <Clock className="h-4 w-4" />
      <span className="text-sm font-medium">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

export default TimerDisplay;
