import React from "react";

const DisplayWindow = ({ expression, result }) => {
  return (
    <div className="bg-gray-100 px-4 py-3 h-28 flex flex-col items-end justify-end">
      <p className="w-full text-right text-gray-500 font-semibold overflow-x-auto">
        {expression}
      </p>
      <p className="text-3xl font-bold text-gray-800">{result}</p>
    </div>
  );
};

export default DisplayWindow;
