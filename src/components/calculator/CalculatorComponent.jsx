// existing code
// import React, { useState } from "react";
// import DisplayWindow from "./DisplayWindow";
// import KeysWindow from "./KeysWindow";

// const CalculatorComponent = ({ setIsCalculatorDialogOpen }) => {
//   const [expression, setExpression] = useState("");
//   const [displayEXP, setDisplayEXP] = useState("");
//   const [result, setResult] = useState("0");

//   const sciFunc = {
//     sin: "Math.sin",
//     cos: "Math.cos",
//     tan: "Math.tan",
//     ln: "Math.log",
//     log: "Math.log10",
//     π: "Math.PI",
//     e: "Math.E",
//     "^": "**",
//     "√": "Math.sqrt",
//   };

//   function calcResult() {
//     if (expression.length !== 0) {
//       try {
//         let compute = eval(expression);
//         compute = parseFloat(compute.toFixed(4));
//         setResult(compute);
//       } catch (error) {
//         setResult("An Error Occurred!");
//       }
//     } else {
//       setResult("An Error Occurred!");
//     }
//   }

//   function handleButton(value) {
//     if (value === "AC") {
//       setExpression("");
//       setDisplayEXP("");
//       setResult("0");
//     } else if (value === "DEL") {
//       setDisplayEXP(displayEXP.slice(0, -1));
//       setExpression(expression.slice(0, -1));
//     } else if (sciFunc.hasOwnProperty(value)) {
//       setDisplayEXP(displayEXP + value);
//       setExpression(expression + sciFunc[value]);
//     } else if (value === "!") {
//       const lastNum = extractLastNum(expression);
//       if (lastNum != null) {
//         const num = parseFloat(lastNum);
//         setDisplayEXP(displayEXP + value);
//         setExpression(expression.replace(lastNum, factorial(num)));
//       }
//     } else if (value === "=") calcResult();
//     else {
//       setExpression(expression + value);
//       setDisplayEXP(displayEXP + value);
//     }
//   }

//   function factorial(n) {
//     let result = 1;
//     for (let i = 1; i <= n; i++) result *= i;
//     return result;
//   }

//   function extractLastNum(exp) {
//     const numbers = exp.match(/\d+/g);
//     return numbers ? numbers[numbers.length - 1] : null;
//   }

//   return (
//     <div className="w-full max-w-xl border-2 border-gray-300 rounded-lg overflow-hidden shadow-md bg-white">
//       <DisplayWindow expression={displayEXP} result={result} />
//       <KeysWindow handleButton={handleButton} />
//       <div className=" flex items-center w-full">
//         <button
//           onClick={() => setIsCalculatorDialogOpen(false)}
//           className=" w-full text-center my-1.5 mx-8 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer"
//         >
//           Done
//         </button>
//       </div>
//     </div>
//   );
// };

// export default CalculatorComponent;

import React, { useState } from "react";

const DisplayWindow = ({ expression, result }) => {
  return (
    <div className="bg-white border-2 border-gray-400 mx-4 mt-4 mb-2 h-20 flex flex-col items-end justify-center px-3 rounded">
      <div className="text-right text-sm text-gray-600 w-full overflow-x-auto mb-1">
        {expression}
      </div>
      <div className="text-right text-2xl font-bold text-black">{result}</div>
    </div>
  );
};

const KeysWindow = ({ handleButton, angleMode }) => {
  const buttonClass =
    "h-8 text-xs font-medium border border-gray-400 rounded transition-colors";
  const grayButton = `${buttonClass} bg-gray-200 hover:bg-gray-300 text-black`;
  const redButton = `${buttonClass} bg-red-500 hover:bg-red-600 text-white`;
  const greenButton = `${buttonClass} bg-green-500 hover:bg-green-600 text-white`;
  const whiteButton = `${buttonClass} bg-white hover:bg-gray-50 text-black`;

  return (
    <div className="px-4 pb-4">
      {/* First row */}
      <div className="grid grid-cols-2 gap-1 mb-1">
        <div className=" flex gap-2">
          <button
            onClick={() => handleButton("mod")}
            className={`${grayButton} col-span-1 px-2`}
          >
            mod
          </button>
          <div className="col-span-2 flex items-center text-xs ml-2">
            <input
              type="radio"
              checked={angleMode === "Deg"}
              onChange={() => handleButton("Deg")}
              className="mr-1"
            />
            <label>Deg</label>
            <input
              type="radio"
              checked={angleMode === "Rad"}
              onChange={() => handleButton("Rad")}
              className="mr-1 ml-2"
            />
            <label>Rad</label>
          </div>
        </div>
        <div className=" grid grid-cols-5 gap-2">
          <button
            onClick={() => handleButton("MC")}
            className={`${grayButton} col-span-1`}
          >
            MC
          </button>
          <button
            onClick={() => handleButton("MR")}
            className={`${grayButton} col-span-1`}
          >
            MR
          </button>
          <button
            onClick={() => handleButton("MS")}
            className={`${grayButton} col-span-1`}
          >
            MS
          </button>
          <button
            onClick={() => handleButton("M+")}
            className={`${grayButton} col-span-1`}
          >
            M+
          </button>
          <button
            onClick={() => handleButton("M-")}
            className={`${grayButton} col-span-1`}
          >
            M-
          </button>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-12 gap-1 mb-1">
        <button
          onClick={() => handleButton("sinh")}
          className={`${whiteButton} col-span-1`}
        >
          sinh
        </button>
        <button
          onClick={() => handleButton("cosh")}
          className={`${whiteButton} col-span-1`}
        >
          cosh
        </button>
        <button
          onClick={() => handleButton("tanh")}
          className={`${whiteButton} col-span-1`}
        >
          tanh
        </button>
        <button
          onClick={() => handleButton("Exp")}
          className={`${whiteButton} col-span-1`}
        >
          Exp
        </button>
        <button
          onClick={() => handleButton("(")}
          className={`${whiteButton} col-span-1`}
        >
          (
        </button>
        <button
          onClick={() => handleButton(")")}
          className={`${whiteButton} col-span-1`}
        >
          )
        </button>
        <button
          onClick={() => handleButton("DEL")}
          className={`${redButton} col-span-2`}
        >
          ←
        </button>
        <button
          onClick={() => handleButton("AC")}
          className={`${redButton} col-span-1`}
        >
          AC
        </button>
        <button
          onClick={() => handleButton("+/-")}
          className={`${redButton} col-span-1`}
        >
          +/-
        </button>
        <button
          onClick={() => handleButton("√")}
          className={`${whiteButton} col-span-1`}
        >
          √
        </button>
        <div className="col-span-2"></div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-12 gap-1 mb-1">
        <button
          onClick={() => handleButton("sinh⁻¹")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          sinh⁻¹
        </button>
        <button
          onClick={() => handleButton("cosh⁻¹")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          cosh⁻¹
        </button>
        <button
          onClick={() => handleButton("tanh⁻¹")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          tanh⁻¹
        </button>
        <button
          onClick={() => handleButton("log")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          log
        </button>
        <button
          onClick={() => handleButton("ln")}
          className={`${whiteButton} col-span-1`}
        >
          ln
        </button>
        <button
          onClick={() => handleButton("log")}
          className={`${whiteButton} col-span-1`}
        >
          log
        </button>
        <button
          onClick={() => handleButton("7")}
          className={`${whiteButton} col-span-1`}
        >
          7
        </button>
        <button
          onClick={() => handleButton("8")}
          className={`${whiteButton} col-span-1`}
        >
          8
        </button>
        <button
          onClick={() => handleButton("9")}
          className={`${whiteButton} col-span-1`}
        >
          9
        </button>
        <button
          onClick={() => handleButton("/")}
          className={`${whiteButton} col-span-1`}
        >
          /
        </button>
        <button
          onClick={() => handleButton("%")}
          className={`${whiteButton} col-span-1`}
        >
          %
        </button>
      </div>

      {/* Fourth row */}
      <div className="grid grid-cols-12 gap-1 mb-1">
        <button
          onClick={() => handleButton("π")}
          className={`${whiteButton} col-span-1`}
        >
          π
        </button>
        <button
          onClick={() => handleButton("e")}
          className={`${whiteButton} col-span-1`}
        >
          e
        </button>
        <button
          onClick={() => handleButton("!")}
          className={`${whiteButton} col-span-1`}
        >
          n!
        </button>
        <button
          onClick={() => handleButton("^")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          x^y
        </button>
        <button
          onClick={() => handleButton("eˣ")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          eˣ
        </button>
        <button
          onClick={() => handleButton("10ˣ")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          10ˣ
        </button>
        <button
          onClick={() => handleButton("4")}
          className={`${whiteButton} col-span-1`}
        >
          4
        </button>
        <button
          onClick={() => handleButton("5")}
          className={`${whiteButton} col-span-1`}
        >
          5
        </button>
        <button
          onClick={() => handleButton("6")}
          className={`${whiteButton} col-span-1`}
        >
          6
        </button>
        <button
          onClick={() => handleButton("*")}
          className={`${whiteButton} col-span-1`}
        >
          *
        </button>
        <button
          onClick={() => handleButton("1/x")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          1/x
        </button>
      </div>

      {/* Fifth row */}
      <div className="grid grid-cols-12 gap-1 mb-1">
        <button
          onClick={() => handleButton("sin")}
          className={`${whiteButton} col-span-1`}
        >
          sin
        </button>
        <button
          onClick={() => handleButton("cos")}
          className={`${whiteButton} col-span-1`}
        >
          cos
        </button>
        <button
          onClick={() => handleButton("tan")}
          className={`${whiteButton} col-span-1`}
        >
          tan
        </button>
        <button
          onClick={() => handleButton("^")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          x^y
        </button>
        <button
          onClick={() => handleButton("x³")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          x³
        </button>
        <button
          onClick={() => handleButton("x²")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          x²
        </button>
        <button
          onClick={() => handleButton("1")}
          className={`${whiteButton} col-span-1`}
        >
          1
        </button>
        <button
          onClick={() => handleButton("2")}
          className={`${whiteButton} col-span-1`}
        >
          2
        </button>
        <button
          onClick={() => handleButton("3")}
          className={`${whiteButton} col-span-1`}
        >
          3
        </button>
        <button
          onClick={() => handleButton("-")}
          className={`${whiteButton} col-span-1`}
        >
          -
        </button>
        <button
          onClick={() => handleButton("=")}
          className={`${greenButton} col-span-1 row-span-2`}
        >
          =
        </button>
      </div>

      {/* Sixth row */}
      <div className="grid grid-cols-12 gap-1">
        <button
          onClick={() => handleButton("sin⁻¹")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          sin⁻¹
        </button>
        <button
          onClick={() => handleButton("cos⁻¹")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          cos⁻¹
        </button>
        <button
          onClick={() => handleButton("tan⁻¹")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          tan⁻¹
        </button>
        <button
          onClick={() => handleButton("ʸ√x")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          ʸ√x
        </button>
        <button
          onClick={() => handleButton("³√")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          ³√
        </button>
        <button
          onClick={() => handleButton("|x|")}
          className={`${whiteButton} col-span-1 text-[10px]`}
        >
          |x|
        </button>
        <button
          onClick={() => handleButton("0")}
          className={`${whiteButton} col-span-2`}
        >
          0
        </button>
        <button
          onClick={() => handleButton(".")}
          className={`${whiteButton} col-span-1`}
        >
          .
        </button>
        <button
          onClick={() => handleButton("+")}
          className={`${whiteButton} col-span-1`}
        >
          +
        </button>
      </div>
    </div>
  );
};

const CalculatorComponent = ({ setIsCalculatorDialogOpen }) => {
  const [expression, setExpression] = useState("");
  const [displayEXP, setDisplayEXP] = useState("");
  const [result, setResult] = useState("0");
  const [memory, setMemory] = useState(0);
  const [angleMode, setAngleMode] = useState("Deg");

  const sciFunc = {
    sin: "Math.sin",
    cos: "Math.cos",
    tan: "Math.tan",
    ln: "Math.log",
    log: "Math.log10",
    π: "Math.PI",
    e: "Math.E",
    "^": "**",
    "√": "Math.sqrt",
  };

  function calcResult() {
    if (expression.length !== 0) {
      try {
        let compute = eval(expression);
        compute = parseFloat(compute.toFixed(4));
        setResult(compute.toString());
      } catch (error) {
        setResult("An Error Occurred!");
      }
    } else {
      setResult("An Error Occurred!");
    }
  }

  function handleButton(value) {
    if (value === "AC") {
      setExpression("");
      setDisplayEXP("");
      setResult("0");
    } else if (value === "DEL") {
      setDisplayEXP(displayEXP.slice(0, -1));
      setExpression(expression.slice(0, -1));
    } else if (value === "Deg") {
      setAngleMode("Deg");
    } else if (value === "Rad") {
      setAngleMode("Rad");
    } else if (value === "M+") {
      setMemory(memory + parseFloat(result));
    } else if (value === "M-") {
      setMemory(memory - parseFloat(result));
    } else if (value === "MR") {
      setResult(memory.toString());
    } else if (value === "MC") {
      setMemory(0);
    } else if (value === "MS") {
      setMemory(parseFloat(result));
    } else if (value === "+/-") {
      if (result !== "0") {
        setResult((parseFloat(result) * -1).toString());
      }
    } else if (value === "1/x") {
      if (result !== "0") {
        setResult((1 / parseFloat(result)).toString());
      }
    } else if (value === "x²") {
      setResult((parseFloat(result) ** 2).toString());
    } else if (value === "x³") {
      setResult((parseFloat(result) ** 3).toString());
    } else if (sciFunc.hasOwnProperty(value)) {
      // Handle angle mode for trig functions
      if (["sin", "cos", "tan"].includes(value) && angleMode === "Deg") {
        setDisplayEXP(displayEXP + value);
        setExpression(expression + `Math.${value}(Math.PI/180*`);
      } else {
        setDisplayEXP(displayEXP + value);
        setExpression(expression + sciFunc[value]);
      }
    } else if (value === "!") {
      const lastNum = extractLastNum(expression);
      if (lastNum != null) {
        const num = parseFloat(lastNum);
        setDisplayEXP(displayEXP + value);
        setExpression(expression.replace(lastNum, factorial(num)));
      }
    } else if (value === "=") {
      calcResult();
    } else {
      setExpression(expression + value);
      setDisplayEXP(displayEXP + value);
    }
  }

  function factorial(n) {
    if (n < 0) return "Error";
    let result = 1;
    for (let i = 1; i <= n; i++) result *= i;
    return result;
  }

  function extractLastNum(exp) {
    const numbers = exp.match(/\d+/g);
    return numbers ? numbers[numbers.length - 1] : null;
  }

  return (
    <div className="w-full max-w-2xl border-2 border-gray-400 rounded-lg overflow-hidden shadow-lg bg-gray-100">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-bold text-lg">Scientific Calculator</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCalculatorDialogOpen(false)}
            className="text-white hover:text-gray-200 text-xl font-bold bg-blue-400 px-2 rounded-full cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>

      {/* Display */}
      <DisplayWindow expression={displayEXP} result={result} />

      {/* Keys */}
      <KeysWindow handleButton={handleButton} angleMode={angleMode} />
    </div>
  );
};

export default CalculatorComponent;
