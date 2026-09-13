import React, { useEffect, useState } from "react";
import { Dialog } from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { MdClose, MdDelete } from "react-icons/md";
import { FaBook, FaChevronUp } from "react-icons/fa";
import { TbBuildingCog, TbBuildingPlus } from "react-icons/tb";
import { ExamContext } from "../../../../context/ExamContext";
import { useContext } from "react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

function SubjectsAdminPage() {
  const [openSubjectPopup, setOpenSubjectPopup] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCategory, setSubjectCategory] = useState(
    EXAM_CATEGORY_OPTIONS[0].value
  );
  const [subtopics, setSubtopics] = useState([{ name: "" }]);
  const { subjects, setSubjects } = useContext(ExamContext);
  const [openDeletePopup, setOpenDeletePopup] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // Category tab: this is the "GATE has a separate way to input questions"
  // requirement — subjects (and therefore the questions/exams built under
  // them) are organized per category so the admin only works within one
  // category's content at a time, never a mixed list.
  const [activeCategory, setActiveCategory] = useState("all");

  const visibleSubjects =
    activeCategory === "all"
      ? subjects
      : subjects.filter((subject) => subject.category === activeCategory);

  const handleOpenDeleteDialog = (subject) => {
    setSelectedSubject(subject);
    setOpenDeletePopup(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeletePopup(false);
    setSelectedSubject(null);
  };

  const handleEditSubject = (subject) => {
    setSubjectName(subject.name);
    setSubjectCategory(subject.category || EXAM_CATEGORY_OPTIONS[0].value);
    setSubtopics(subject.subtopics);
    setSelectedSubject(subject);
    setIsEditing(true);
    setOpenSubjectPopup(true);
  };

  const [expandedSubjects, setExpandedSubjects] = useState({});

  const toggleSubject = (subjectName) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectName]: !prev[subjectName],
    }));
  };

  const handleDeleteSubject = () => {
    if (!selectedSubject) return;
    axios
      .delete(
        `${import.meta.env.VITE_APP_API_URL}/subjects/delete/${
          selectedSubject._id
        }`
      )
      .then(() => {
        setSubjects(
          subjects.filter((subject) => subject._id !== selectedSubject._id)
        );
        toast.success("Subject deleted successfully!");
        handleCloseDeleteDialog();
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.response?.data?.error);
      });
  };

  const handleClickOpenSubjectPopup = () => {
    setSubjectName("");
    setSubjectCategory(
      activeCategory !== "all" ? activeCategory : EXAM_CATEGORY_OPTIONS[0].value
    );
    setSubtopics([{ name: "" }]);
    setIsEditing(false);
    setOpenSubjectPopup(true);
  };

  const handleCloseSubjectPopup = () => {
    setOpenSubjectPopup(false);
  };

  const handleAddSubtopic = () => {
    setSubtopics([...subtopics, { name: "" }]);
  };

  const handleSubtopicChange = (index, field, value) => {
    const updatedSubtopics = [...subtopics];
    updatedSubtopics[index][field] = value;
    setSubtopics(updatedSubtopics);
  };

  const handleDeleteSubtopic = (index) => {
    setSubtopics(subtopics.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!subjectCategory) {
      toast.error("Please select an exam category");
      return;
    }
    const newSubject = {
      name: subjectName,
      category: subjectCategory,
      subtopics: subtopics.filter(
        (subtopic) => subtopic.name !== "" && subtopic.levels !== ""
      ),
    };

    if (isEditing && selectedSubject) {
      axios
        .put(
          `${import.meta.env.VITE_APP_API_URL}/subjects/update/${
            selectedSubject._id
          }`,
          newSubject
        )
        .then(() => {
          toast.success("Subject updated successfully!");
          setSubjects(
            subjects.map((subject) =>
              subject._id === selectedSubject._id
                ? { ...subject, ...newSubject }
                : subject
            )
          );
          handleCloseSubjectPopup();
        })
        .catch((err) => toast.error(err?.response?.data?.error));
    } else {
      axios
        .post(`${import.meta.env.VITE_APP_API_URL}/subjects/create`, newSubject)
        .then(() => {
          toast.success("Subject created successfully!");
          handleCloseSubjectPopup();
          setSubjects([...subjects, newSubject]);
        })
        .catch((err) => toast.error(err?.response?.data?.error));
    }
  };

  return (
    <div className=" flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between gap-20 font-inter">
        <div className=" flex flex-col gap-2">
          <h1 className=" text-3xl text-stone-700 font-bold font-poppins">
            Subject
          </h1>
          <p className=" text-stone-400 font-medium">
            Manage subjects and subtopics with ease. Create, edit, delete, and
            view subjects, define subtopics, and set their difficulty levels to
            organize exam content efficiently.
          </p>
        </div>
        <button
          onClick={handleClickOpenSubjectPopup}
          className=" text-nowrap bg-indigo-400 text-stone-50 font-medium py-2 px-5 rounded-4xl font-poppins cursor-pointer hover:opacity-85 duration-300"
        >
          Create Subject
        </button>
      </div>

      {/* Category tabs — isolation-by-workflow: the admin works within one
          exam category's subjects at a time (or "All" to see everything),
          so GATE and TNPSC content are never presented mixed together. */}
      <div className="flex flex-wrap items-center gap-2 font-inter">
        <button
          onClick={() => setActiveCategory("all")}
          className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
            activeCategory === "all"
              ? "bg-indigo-500 text-white"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          All
        </button>
        {EXAM_CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveCategory(opt.value)}
            className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
              activeCategory === opt.value
                ? "bg-indigo-500 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {visibleSubjects.map((subject) => (
          <div
            key={subject.name}
            className=" bg-white border border-indigo-400 rounded-xl overflow-hidden hover:shadow transition-all duration-300 group h-fit"
          >
            <div className="flex items-center justify-between p-5 bg-gradient-to-r bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
                  <FaBook className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-800">
                    {subject.name}
                  </h2>
                  <p className="text-sm text-stone-400">
                    {subject.subtopics.length} topics ·{" "}
                    <span className="text-indigo-400 font-medium">
                      {getCategoryLabel(subject.category)}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSubject(subject.name)}
                className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <FaChevronUp
                  className={` ${
                    expandedSubjects[subject.name] ? " rotate-0" : " rotate-180"
                  } duration-300 w-4 h-4 text-gray-500 `}
                />
              </button>
            </div>
            <div
              className={` px-4 space-y-3 transition-all duration-500 ease-in-out ${
                expandedSubjects[subject.name]
                  ? "max-h-[500px] opacity-100 pt-2"
                  : "max-h-0 opacity-0"
              } overflow-y-scroll`}
            >
              {subject.subtopics.map((subtopic) => (
                <div
                  key={subtopic.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TbBuildingCog className="w-4 h-4 text-indigo-400" />
                    <span className="text-stone-700">{subtopic.name}</span>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 pb-4">
                <button
                  onClick={() => handleEditSubject(subject)}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-gray-200 text-stone-700 hover:border-indigo-400 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <TbBuildingPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit Subject</span>
                </button>
                <button
                  onClick={() => handleOpenDeleteDialog(subject)}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-gray-200 text-stone-700 hover:border-indigo-400 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <MdDelete className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete Subject</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={openSubjectPopup} onClose={handleCloseSubjectPopup}>
        <div className=" flex flex-col gap-5 sm:min-w-[500px] p-5 ">
          <div className=" flex items-start justify-between gap-6 w-full">
            <div className=" flex flex-col gap-1">
              <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
                {isEditing ? "Edit Subject" : "Create New Subject"}
              </h1>
              <p className=" text-sm text-stone-500 font-work-sans">
                Add and manage subjects with subtopics and difficulty levels.
                Edit or remove subjects to keep your content organized.
              </p>
            </div>
            <MdClose
              onClick={handleCloseSubjectPopup}
              className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className=" flex flex-col gap-2 font-inter">
            <input
              type="text"
              placeholder="Subject Name"
              name="subjectName"
              className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-xl bg-white "
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
            <select
              className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-xl bg-white text-stone-700"
              value={subjectCategory}
              onChange={(e) => setSubjectCategory(e.target.value)}
              required
            >
              {EXAM_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {subtopics.map((subtopic, index) => (
              <>
                <div key={index} className=" flex gap-1">
                  <input
                    type="text"
                    placeholder={`Subtopic Name ${index + 1}`}
                    className="border border-stone-300 py-[10px] px-4 focus:outline-none rounded-xl bg-white w-full"
                    onChange={(e) =>
                      handleSubtopicChange(index, "name", e.target.value)
                    }
                    value={subtopic.name}
                    required
                  />
                  {index > 0 && (
                    <div className=" flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer w-full max-w-12">
                      <MdDelete
                        onClick={() => handleDeleteSubtopic(index)}
                        className=" text-2xl "
                      />
                    </div>
                  )}
                </div>
              </>
            ))}
            <div className=" flex items-end justify-end">
              <button
                className=" text-[13px] text-white bg-indigo-400 font-medium py-1 px-3 rounded-md cursor-pointer hover:opacity-85 duration-300"
                onClick={handleAddSubtopic}
              >
                Add Subtopic
              </button>
            </div>
          </div>
          <div className=" grid grid-cols-2 gap-1">
            <button
              onClick={handleCloseSubjectPopup}
              className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              {isEditing ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      </Dialog>
      <Dialog open={openDeletePopup} onClose={handleCloseDeleteDialog}>
        <div className=" flex flex-col gap-6 sm:min-w-[500px] p-5 ">
          <div className=" flex items-start justify-between gap-6 w-full">
            <div className=" flex flex-col gap-1">
              <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
                Confirm Delete
              </h1>
              <p className=" text-sm text-stone-500 font-work-sans">
                Are you sure you want to delete this subject?
              </p>
            </div>
            <MdClose
              onClick={handleCloseDeleteDialog}
              className=" text-stone-500 font-medium text-2xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className=" grid grid-cols-2 gap-1.5">
            <button
              onClick={handleCloseDeleteDialog}
              className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubject}
              className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SubjectsAdminPage;
