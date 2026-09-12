import React, { useState, useEffect } from "react";
import {
  Layers3,
  Settings2,
  Plus,
  Trash2,
  CheckCircle2,
  ListChecks,
  Shuffle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

/**
 * QuestionSetManager Component
 * Allows managing multiple question sets (Manual vs Random)
 *
 * Props:
 * - questions: Array of current pool questions (objects)
 * - questionSets: Array of set objects
 * - setQuestionSets: Function to update sets
 * - activeSetIndex: Index of the currently active set
 * - setActiveSetIndex: Function to update active set index
 */
const QuestionSetManager = ({
  questions,
  questionSets,
  setQuestionSets,
  activeSetIndex,
  setActiveSetIndex,
}) => {
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);

  // Initialize with a default set if empty
  useEffect(() => {
    if (!questionSets || questionSets.length === 0) {
      setQuestionSets([
        {
          name: "Default Set",
          selectionType: "manual",
          questions: questions.map((_, i) => i), // All questions selected by default (indices)
          config: {
            MCQ: { count: 0 },
            MSQ: { count: 0 },
            "Fill in the Blanks": { count: 0 },
            "Short Answer": { count: 0 },
          },
        },
      ]);
      setActiveSetIndex(0);
    }
  }, []);

  // Ensure currentSet is always valid
  const currentSet = questionSets[selectedSetIndex] || (questionSets.length > 0 ? questionSets[0] : {});
  // Use questionsByType for organizing the UI
  const questionsByType = (questions || []).reduce((acc, q, i) => {
    const type = q.questionType;
    if (!acc[type]) acc[type] = [];
    acc[type].push({ ...q, originalIndex: i });
    return acc;
  }, {});


  const handleAddSet = () => {
    const newSet = {
      name: `Set ${questionSets.length + 1}`,
      selectionType: "manual",
      questions: [],
      config: {
        MCQ: { count: 0 },
        MSQ: { count: 0 },
        "Fill in the Blanks": { count: 0 },
        "Short Answer": { count: 0 },
      },
    };
    const newSets = [...questionSets, newSet];
    setQuestionSets(newSets);
    setSelectedSetIndex(newSets.length - 1);
  };

  const handleDeleteSet = (index, e) => {
    e.stopPropagation();
    if (questionSets.length <= 1) return; // Prevent deleting last set

    const newSets = questionSets.filter((_, i) => i !== index);
    setQuestionSets(newSets);

    if (activeSetIndex === index) {
      setActiveSetIndex(0);
    } else if (activeSetIndex > index) {
      setActiveSetIndex(activeSetIndex - 1);
    }

    if (selectedSetIndex === index) {
      setSelectedSetIndex(Math.max(0, index - 1));
    } else if (selectedSetIndex > index) {
      setSelectedSetIndex(selectedSetIndex - 1);
    }
  };

  const updateCurrentSet = (field, value) => {
    const newSets = [...questionSets];
    if(newSets[selectedSetIndex]) {
        newSets[selectedSetIndex] = {
        ...newSets[selectedSetIndex],
        [field]: value,
        };
        setQuestionSets(newSets);
    }
  };

  const updateConfig = (type, value) => {
    const newSets = [...questionSets];
    if (newSets[selectedSetIndex]) {
        const currentConfig = newSets[selectedSetIndex].config || {};
        newSets[selectedSetIndex].config = {
        ...currentConfig,
        [type]: { ...currentConfig[type], count: parseInt(value) || 0 },
        };
        setQuestionSets(newSets);
    }
  };

  const toggleQuestionSelection = (qIndex) => {
    const newSets = [...questionSets];
    if (newSets[selectedSetIndex]) {
        const currentQuestions = newSets[selectedSetIndex].questions || [];
        
        if (currentQuestions.includes(qIndex)) {
        newSets[selectedSetIndex].questions = currentQuestions.filter(
            (i) => i !== qIndex
        );
        } else {
        newSets[selectedSetIndex].questions = [...currentQuestions, qIndex].sort(
            (a, b) => a - b
        );
        }
        setQuestionSets(newSets);
    }
  };

  if (!questionSets || questionSets.length === 0) {
      return null; // Or loading state
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Layers3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Question Sets</h3>
            <p className="text-sm text-gray-600">
              Manage different versions of question selections
            </p>
          </div>
        </div>
        <button
          onClick={handleAddSet}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Set
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[600px]">
        {/* Sidebar - List of Sets */}
        <div className="w-full md:w-64 border-r border-stone-200 bg-gray-50 overflow-y-auto">
          {questionSets.map((set, index) => (
            <div
              key={index}
              onClick={() => setSelectedSetIndex(index)}
              className={`group flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer transition-all ${
                selectedSetIndex === index
                  ? "bg-white border-l-4 border-l-emerald-500 shadow-sm"
                  : "hover:bg-gray-100 border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                     <span
                        className={`block text-sm font-medium truncate ${
                        selectedSetIndex === index
                            ? "text-gray-900"
                            : "text-gray-600"
                        }`}
                    >
                        {set.name}
                    </span>
                    {activeSetIndex === index && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Active
                        </span>
                    )}
                 </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{set.selectionType}</span>
                      <span>
                          {set.selectionType === 'manual' 
                            ? `${set.questions?.length || 0} Qs` 
                            : 'Random'}
                      </span>
                  </div>
              </div>
              
              {questionSets.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteSet(index, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all ml-2"
                    title="Delete Set"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Set Name</label>
                <input 
                    type="text" 
                    value={currentSet.name || ''} 
                    onChange={(e) => updateCurrentSet('name', e.target.value)}
                    className="text-xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full placeholder-gray-300"
                    placeholder="Enter set name..."
                />
             </div>
             
             <div className="flex items-center gap-3">
                 {activeSetIndex === selectedSetIndex ? (
                     <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium border border-emerald-200">
                         <CheckCircle2 className="h-4 w-4" />
                         Active for Students
                     </div>
                 ) : (
                     <button
                        onClick={() => setActiveSetIndex(selectedSetIndex)} 
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                     >
                         Set as Active
                     </button>
                 )}
             </div>
          </div>

          {/* Mode Selection */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit mb-6">
            <button
              onClick={() => updateCurrentSet("selectionType", "manual")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentSet.selectionType === "manual"
                  ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              <ListChecks className="h-4 w-4" />
              Manual Selection
            </button>
            <button
              onClick={() => updateCurrentSet("selectionType", "random")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentSet.selectionType === "random"
                  ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              <Shuffle className="h-4 w-4" />
              Random Selection
            </button>
          </div>

          {/* Manual Selection View */}
          {currentSet.selectionType === "manual" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3 items-start">
                  <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>In Manual mode, explicitly select the questions you want students to see. The questions will appear in the order they are in the pool (unless shuffled at exam level).</p>
              </div>

              {Object.entries(questionsByType).map(([type, typeQuestions]) => (
                <div key={type} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                             type === "MCQ" ? "bg-blue-500" :
                             type === "MSQ" ? "bg-purple-500" :
                             type === "Fill in the Blanks" ? "bg-amber-500" :
                             "bg-teal-500"
                        }`}></span>
                        <h4 className="font-semibold text-gray-800">{type}</h4>
                    </div>
                    <span className="text-xs font-medium bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600">
                        {typeQuestions.filter(q => currentSet.questions?.includes(q.originalIndex)).length} / {typeQuestions.length} selected
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                      {typeQuestions.map((q) => (
                          <div 
                            key={q.originalIndex} 
                            onClick={() => toggleQuestionSelection(q.originalIndex)}
                            className={`flex items-start gap-3 p-4 cursor-pointer transition-colors group ${
                                currentSet.questions?.includes(q.originalIndex) 
                                    ? 'bg-emerald-50/30 hover:bg-emerald-50/50' 
                                    : 'hover:bg-gray-50'
                            }`}
                          >
                             <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                 currentSet.questions?.includes(q.originalIndex) 
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                                    : 'border-gray-300 bg-white group-hover:border-emerald-400'
                             }`}>
                                 {currentSet.questions?.includes(q.originalIndex) && <CheckCircle2 className="h-3.5 w-3.5" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <p className="text-sm text-gray-900 font-medium line-clamp-2">{q.questionText || "Untitled Question"}</p>
                                 <div className="flex gap-2 mt-1.5">
                                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">ID: {q.originalIndex + 1}</span>
                                    {q.image && <span className="text-xs text-blue-500 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-blue-500"></span>Has Image</span>}
                                 </div>
                             </div>
                          </div>
                      ))}
                  </div>
                </div>
              ))}
              
              {(!questions || questions.length === 0) && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-500 font-medium">No questions available in the pool.</p>
                      <p className="text-sm text-gray-400 mt-1">Add questions above to select them here.</p>
                  </div>
              )}
            </div>
          )}

          {/* Random Selection View */}
          {currentSet.selectionType === "random" && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-purple-50 text-purple-800 p-4 rounded-xl text-sm flex gap-3 items-start">
                  <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>In Random mode, the system will randomly select a specified number of questions from each category for every student attempt.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(questionsByType).map(([type, typeQuestions]) => (
                   <div key={type} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-center mb-4">
                           <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                    type === "MCQ" ? "bg-blue-500" :
                                    type === "MSQ" ? "bg-purple-500" :
                                    type === "Fill in the Blanks" ? "bg-amber-500" :
                                    "bg-teal-500"
                                }`}></span>
                                <h4 className="font-bold text-gray-800">{type}</h4>
                           </div>
                           <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">Available: {typeQuestions.length}</span>
                       </div>
                       
                       <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                           <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Count to Select</label>
                           <div className="flex items-center gap-3">
                               <input 
                                    type="number" 
                                    min="0" 
                                    max={typeQuestions.length}
                                    value={currentSet.config?.[type]?.count || 0}
                                    onChange={(e) => updateConfig(type, e.target.value)}
                                    className="w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                               />
                               <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                   <div 
                                      className="h-full bg-emerald-500 transition-all duration-500"
                                      style={{ width: `${Math.min(100, ((currentSet.config?.[type]?.count || 0) / (typeQuestions.length || 1)) * 100)}%` }}
                                   ></div>
                               </div>
                           </div>
                           <p className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                               <span>
                                   {currentSet.config?.[type]?.count > 0 ? `Randomly includes ${currentSet.config[type].count} questions` : 'No questions included'}
                               </span>
                               {parseInt(currentSet.config?.[type]?.count) > typeQuestions.length && (
                                   <span className="text-red-500 font-bold">Exceeds available!</span>
                               )}
                           </p>
                       </div>
                   </div>
               ))}
               </div>
               
               {(!questions || questions.length === 0) && (
                   <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500 font-medium">No questions available to configure.</p>
                  </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionSetManager;
