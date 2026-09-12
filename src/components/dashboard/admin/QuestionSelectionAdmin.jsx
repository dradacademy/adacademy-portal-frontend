import React from "react";
import { Layers3, Settings2 } from "lucide-react";

const QuestionSelectionAdmin = ({
  questions,
  questionSelection,
  setQuestionSelection,
}) => {
  // Group questions by type
  const questionsByType = questions.reduce((acc, question, index) => {
    const type = question.questionType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push({ ...question, originalIndex: index });
    return acc;
  }, {});

  const handleSelectionChange = (questionType, field, value) => {
    setQuestionSelection((prev) => ({
      ...prev,
      [questionType]: {
        ...prev[questionType],
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const getMaxIndex = (questionType) => {
    const typeQuestions = questionsByType[questionType] || [];
    return typeQuestions.length;
  };

  const getEndIndex = (questionType) => {
    const selection = questionSelection[questionType];
    const startIndex = selection?.startIndex || 0;
    const count = selection?.count || 0;
    return Math.min(startIndex + count, getMaxIndex(questionType));
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Settings2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Question Selection</h3>
            <p className="text-sm text-gray-600">
              Configure which questions students will see for each question type
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 gap-3">
        {Object.entries(questionsByType).map(
          ([questionType, typeQuestions]) => (
            <div
              key={questionType}
              className="border border-stone-200 rounded-xl p-4 bg-stone-50"
            >
              <div className="flex items-center gap-3 mb-4">
                <Layers3 className="h-5 w-5 text-indigo-500" />
                <h4 className="font-semibold text-gray-900">{questionType}</h4>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                  {typeQuestions.length} questions available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start From Question
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={getMaxIndex(questionType)}
                    value={
                      (questionSelection[questionType]?.startIndex || 0) + 1
                    }
                    onChange={(e) =>
                      handleSelectionChange(
                        questionType,
                        "startIndex",
                        Math.max(0, parseInt(e.target.value) - 1)
                      )
                    }
                    className="w-full border border-stone-300 py-2 px-3 focus:outline-none rounded-lg bg-white"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={
                      getMaxIndex(questionType) -
                      (questionSelection[questionType]?.startIndex || 0)
                    }
                    value={questionSelection[questionType]?.count || 0}
                    onChange={(e) =>
                      handleSelectionChange(
                        questionType,
                        "count",
                        e.target.value
                      )
                    }
                    className="w-full border border-stone-300 py-2 px-3 focus:outline-none rounded-lg bg-white"
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="bg-white border border-stone-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Range:</p>
                    <p className="font-semibold text-gray-900">
                      {questionSelection[questionType]?.count > 0
                        ? `Q${
                            (questionSelection[questionType]?.startIndex || 0) +
                            1
                          } - Q${getEndIndex(questionType)}`
                        : "No questions selected"}
                    </p>
                  </div>
                </div>
              </div>

              {/* {questionSelection[questionType]?.count > 0 && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-stone-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Questions Preview:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {typeQuestions
                      .slice(
                        questionSelection[questionType].startIndex,
                        getEndIndex(questionType)
                      )
                      .map((question, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-600 truncate"
                        >
                          Q
                          {questionSelection[questionType].startIndex +
                            index +
                            1}
                          : {question.questionText || "Empty question"}
                        </div>
                      ))}
                  </div>
                </div>
              )} */}
            </div>
          )
        )}

        {Object.keys(questionsByType).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Layers3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No questions added yet</p>
            <p className="text-sm">
              Add questions to configure selection settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionSelectionAdmin;
