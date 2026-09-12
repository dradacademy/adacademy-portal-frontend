import React from "react";

const KeysWindow = ({ handleButton }) => {
  const sciKeys = ["sin", "cos", "ln", "log", "tan", "π", "e", "^", "!", "√"];

  const basicKeys = [
    "7",
    "8",
    "9",
    "*",
    "/",
    "4",
    "5",
    "6",
    "-",
    "(",
    "1",
    "2",
    "3",
    "+",
    ")",
    ".",
    "0",
    "DEL",
    "AC",
    "=",
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4">
      <div className="grid grid-cols-5 md:grid-cols-2 gap-2 w-full md:w-1/3">
        {sciKeys.map((item, index) => (
          <button
            key={index}
            onClick={() => handleButton(item)}
            className="px-3 py-2 rounded-md text-gray-700 bg-white shadow hover:bg-gray-200 transition"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="hidden md:block w-px bg-gray-300 mx-2"></div>
      <div className="grid grid-cols-5 gap-2 flex-1">
        {basicKeys.map((item, index) => (
          <button
            key={index}
            onClick={() => handleButton(item)}
            className={`px-3 py-2 rounded-md shadow text-lg ${
              item === "="
                ? "bg-green-500 text-white font-bold hover:bg-green-600"
                : item >= "0" && item <= "9"
                ? "text-gray-900 font-semibold bg-white hover:bg-gray-200"
                : "text-gray-600 bg-white hover:bg-gray-200"
            } transition`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeysWindow;
