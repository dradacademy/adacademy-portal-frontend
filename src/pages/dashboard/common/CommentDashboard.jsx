import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import { Dialog } from "@mui/material";
import { MdClose, MdDelete, MdEdit } from "react-icons/md";
import Select from "react-select";
import ReviewCard from "../../../components/dashboard/common/ReviewCard";
import { ExamContext } from "../../../context/ExamContext";

const CommentDashboard = () => {
  const { userData } = useContext(AuthContext);
  const { subjects } = useContext(ExamContext);
  const [subtopics, setSubtopics] = useState([]);
  const [allCommentsData, setAllCommentsData] = useState([]);
  const [openAddReviewPopup, setOpenAddReviewPopup] = useState(false);
  const [openEditReviewPopup, setOpenEditReviewPopup] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    subject: "",
    subTopic: "",
    level: 1,
    message: "",
    evaluator: "",
    startingPercentage: null,
    endingPercentage: null,
  });
  const [editReviewFormData, setEditReviewFormData] = useState({
    id: "",
    subjectName: "",
    subject: "",
    subTopic: "",
    subTopicName: "",
    level: null,
    message: "",
    startingPercentage: null,
    endingPercentage: null,
  });

  useEffect(() => {
    if (reviewFormData.subject) {
      const subtopicsDataForSubject = subjects
        .filter((sub) => sub._id === reviewFormData.subject)
        .map((sub) => sub.subtopics)
        .flat();

      setSubtopics(subtopicsDataForSubject);
    }
  }, [reviewFormData.subject, subjects]);

  useEffect(() => {
    const fetchCommentsData = async () => {
      try {
        const { data } = await axios.get(
          userData.role === "admin"
            ? `${import.meta.env.VITE_APP_API_URL}/review/get`
            : `${import.meta.env.VITE_APP_API_URL}/review/get-by-evaluator/${
                userData._id
              }`
        );
        setAllCommentsData(data);
      } catch (error) {
        console.error(error);
        toast.error("Unable to fetch the comments");
      }
    };

    if (userData?._id) {
      fetchCommentsData();
    }
  }, [userData?._id]);

  const handleOpenAddReviewPopup = () => {
    setOpenAddReviewPopup(true);
  };

  const handleCloseAddReviewPopup = () => {
    setOpenAddReviewPopup(false);
    setReviewFormData({
      subject: "",
      subTopic: "",
      level: 1,
      message: "",
      evaluator: "",
      startingPercentage: null,
      endingPercentage: null,
    });
  };

  const handleOpenEditReviewPopup = (e, comment) => {
    e.preventDefault();
    setEditReviewFormData((prevData) => ({
      ...prevData,
      id: comment._id,
      subjectName: comment.subject.name,
      subject: comment.subject._id,
      subTopic: comment.subject.subtopic._id,
      subTopicName: comment.subject.subtopic.name,
      level: comment.level,
      message: comment.message,
      startingPercentage: comment.startingPercentage,
      endingPercentage: comment.endingPercentage,
    }));
    setOpenEditReviewPopup(true);
  };

  const handleCloseEditReviewPopup = () => {
    setOpenEditReviewPopup(false);
    setEditReviewFormData({
      id: "",
      subjectName: "",
      subject: "",
      subTopic: "",
      subTopicName: "",
      level: null,
      message: "",
      startingPercentage: null,
      endingPercentage: null,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviewFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePercentageChange = (e, type) => {
    const { name, value } = e.target;
    if (type === "add") {
      setReviewFormData((prevData) => {
        const updatedData = {
          ...prevData,
          [name]: parseInt(value),
        };
        return updatedData;
      });
    } else if (type === "edit") {
      setEditReviewFormData((prevData) => {
        const updatedData = {
          ...prevData,
          [name]: parseInt(value),
        };
        return updatedData;
      });
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    const updatedReviewData = {
      ...reviewFormData,
      evaluator: userData._id,
    };

    if (updatedReviewData.message.trim() === "") {
      return toast.error("Message cannot be empty!");
    }

    if (
      reviewFormData.startingPercentage > reviewFormData.endingPercentage ||
      reviewFormData.startingPercentage < 0 ||
      reviewFormData.endingPercentage > 100
    ) {
      return toast.error(
        "Kindly check the percentages of both starting and ending!"
      );
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/review/create`,
        updatedReviewData
      );
      setAllCommentsData((prevData) => [...prevData, data]);
      handleCloseAddReviewPopup();
    } catch (error) {
      toast.error("Unable to add a comment");
    }
  };

  const handleEditReview = async (e) => {
    e.preventDefault();

    if (editReviewFormData.message.trim() === "") {
      return toast.error("Message cannot be empty!");
    }

    if (
      editReviewFormData.startingPercentage >
        editReviewFormData.endingPercentage ||
      editReviewFormData.startingPercentage < 0 ||
      editReviewFormData.endingPercentage > 100
    ) {
      return toast.error(
        "Kindly check the percentages of both starting and ending!"
      );
    }

    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_APP_API_URL}/review/edit/${
          editReviewFormData.id
        }`,
        editReviewFormData
      );
      setAllCommentsData((prevData) =>
        prevData.map((comment) =>
          comment._id === data._id
            ? {
                ...comment,
                startingPercentage: data.startingPercentage,
                endingPercentage: data.endingPercentage,
                message: data.message,
              }
            : comment
        )
      );
      handleCloseEditReviewPopup();
    } catch (error) {
      toast.error("Unable to Edit a comment");
    }
  };

  const handleDeleteReview = async (e, commentId) => {
    e.preventDefault();
    if (!commentId) {
      return toast.error("Unable to delete the review");
    }

    try {
      const { data } = await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/review/delete/${commentId}`
      );
      setAllCommentsData((prevData) =>
        prevData.filter((comment) => comment._id !== data._id)
      );
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete the review");
    }
  };

  return (
    <div className=" flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between gap-20 font-inter">
        <div className=" flex flex-col gap-2">
          <h1 className=" text-3xl text-stone-700 font-bold">Comment</h1>
          <p className=" text-stone-400 font-medium">
            {userData.role === "admin"
              ? `As an admin, easily access and review feedback from various evaluators. View detailed comments on each subject, subtopic, and difficulty level for comprehensive analysis.`
              : `Effortlessly manage reviews and feedback. Add, edit, delete, and
            view comments for each subject, subtopic, and difficulty level, and
            define mark ranges to provide targeted evaluations for exam content.`}
          </p>
        </div>
        {userData.role === "evaluator" && (
          <button
            onClick={handleOpenAddReviewPopup}
            className=" text-nowrap bg-indigo-400 text-stone-50 font-medium py-2 px-5 rounded-4xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Add Comment
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {allCommentsData.length > 0 ? (
          allCommentsData.map((comment, index) => (
            <ReviewCard
              key={index}
              index={index}
              userData={userData}
              comment={comment}
              handleOpenEditReviewPopup={handleOpenEditReviewPopup}
              handleDeleteReview={handleDeleteReview}
            />
          ))
        ) : (
          <div className=" text-stone-600">No data available</div>
        )}
      </div>
      <Dialog open={openAddReviewPopup} onClose={handleCloseAddReviewPopup}>
        <form
          onSubmit={handleAddReview}
          className=" flex flex-col gap-6 sm:min-w-[500px] p-5 "
        >
          <div className=" flex items-start justify-between gap-6 w-full">
            <div className=" flex flex-col gap-1">
              <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
                Add Comment
              </h1>
              <p className=" text-sm text-stone-500 font-work-sans">
                Are you sure you want to Add this comment ?
              </p>
            </div>
            <MdClose
              onClick={handleCloseAddReviewPopup}
              className=" text-stone-500 font-medium text-2xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className=" flex flex-col gap-1.5">
            <Select
              placeholder="Select the Subject"
              name="subject"
              value={
                subjects
                  .map((subject) => ({
                    value: subject._id,
                    label: subject.name,
                  }))
                  .find((option) => option.value === reviewFormData.subject) ||
                null
              }
              onChange={(selectedOption) =>
                handleChange({
                  target: { name: "subject", value: selectedOption.value },
                })
              }
              options={subjects.map((subject) => ({
                value: subject._id,
                label: subject.name,
              }))}
              isSearchable={true}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  padding: "4px",
                  borderColor: "#ccc",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#888" },
                }),
              }}
              required
            />
            <Select
              placeholder="Select the Subtopic"
              name="subTopic"
              value={
                subtopics
                  .map((sub) => ({ value: sub._id, label: sub.name }))
                  .find((option) => option.value === reviewFormData.subTopic) ||
                null
              }
              onChange={(selectedOption) =>
                handleChange({
                  target: { name: "subTopic", value: selectedOption.value },
                })
              }
              options={subtopics.map((sub) => ({
                value: sub._id,
                label: sub.name,
              }))}
              isSearchable={true}
              isDisabled={!reviewFormData.subject} // Disable if no subject is selected
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderRadius: "8px",
                  padding: "4px",
                  borderColor: state.isDisabled ? "#ccc" : "#888",
                  backgroundColor: state.isDisabled ? "#fafafa" : "white",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: state.isDisabled ? "#ccc" : "#555",
                  },
                }),
              }}
              required
            />
            <Select
              name="level"
              value={
                [1, 2, 3, 4]
                  .map((lvl) => ({
                    value: lvl,
                    label: `Level ${lvl}`,
                  }))
                  .find((option) => option.value === reviewFormData.level) ||
                null
              }
              onChange={(selectedOption) =>
                handleChange({
                  target: { name: "level", value: selectedOption.value },
                })
              }
              options={[1, 2, 3, 4].map((lvl) => ({
                value: lvl,
                label: `Level ${lvl}`,
              }))}
              isSearchable={false}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  padding: "4px",
                  borderColor: "#ccc",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#888" },
                }),
              }}
              required
            />
            <textarea
              name=""
              id=""
              placeholder="Add a Comment"
              value={reviewFormData.message || ""}
              onChange={(e) =>
                setReviewFormData((prevValue) => ({
                  ...prevValue,
                  message: e.target.value,
                }))
              }
              className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
              required
            ></textarea>
            <div className="flex gap-4">
              <input
                type="number"
                name="startingPercentage"
                value={reviewFormData.startingPercentage}
                onChange={(e) => handlePercentageChange(e, "add")}
                className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
                placeholder="Starting Percentage"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
              <input
                type="number"
                name="endingPercentage"
                value={reviewFormData.endingPercentage}
                onChange={(e) => handlePercentageChange(e, "add")}
                className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
                placeholder="Ending Percentage"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </div>
          </div>
          <div className=" grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleCloseAddReviewPopup}
              className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 text-center"
            >
              Add
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog open={openEditReviewPopup} onClose={handleCloseEditReviewPopup}>
        <form
          onSubmit={handleEditReview}
          className=" flex flex-col gap-6 sm:min-w-[500px] p-5 "
        >
          <div className=" flex items-start justify-between gap-6 w-full">
            <div className=" flex flex-col gap-1">
              <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
                Edit Comment
              </h1>
              <p className=" text-sm text-stone-500 font-work-sans">
                Are you sure you want to Edit this comment ?
              </p>
            </div>
            <MdClose
              onClick={handleCloseEditReviewPopup}
              className=" text-stone-500 font-medium text-2xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className=" flex flex-col gap-1.5">
            <Select
              placeholder="Select the Subject"
              name="subject"
              value={
                editReviewFormData.subjectName
                  ? {
                      label: editReviewFormData.subjectName,
                      value: editReviewFormData.subjectName,
                    }
                  : null
              }
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  padding: "4px",
                  borderColor: "#ccc",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#888" },
                }),
              }}
              isDisabled={true}
            />
            <Select
              placeholder="Select the Subtopic"
              name="subTopic"
              value={
                editReviewFormData.subTopicName
                  ? {
                      label: editReviewFormData.subTopicName,
                      value: editReviewFormData.subTopicName,
                    }
                  : null
              }
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderRadius: "8px",
                  padding: "4px",
                  borderColor: state.isDisabled ? "#ccc" : "#888",
                  backgroundColor: state.isDisabled ? "#fafafa" : "white",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: state.isDisabled ? "#ccc" : "#555",
                  },
                }),
              }}
              isDisabled={true}
            />
            <Select
              name="level"
              value={
                editReviewFormData.level
                  ? {
                      label: `Level ${editReviewFormData.level}`,
                      value: `Level ${editReviewFormData.level}`,
                    }
                  : null
              }
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "8px",
                  padding: "4px",
                  borderColor: "#ccc",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#888" },
                }),
              }}
              isDisabled={true}
            />
            <textarea
              name=""
              id=""
              placeholder="Add a Comment"
              value={editReviewFormData.message || ""}
              onChange={(e) =>
                setEditReviewFormData((prevValue) => ({
                  ...prevValue,
                  message: e.target.value,
                }))
              }
              className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
              required
            ></textarea>
            <div className="flex gap-4">
              <input
                type="number"
                name="startingPercentage"
                value={editReviewFormData.startingPercentage}
                onChange={(e) => handlePercentageChange(e, "edit")}
                className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
                placeholder="Starting Percentage"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
              <input
                type="number"
                name="endingPercentage"
                value={editReviewFormData.endingPercentage}
                onChange={(e) => handlePercentageChange(e, "edit")}
                className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
                placeholder="Ending Percentage"
                onWheel={(e) => e.target.blur()}
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </div>
          </div>
          <div className=" grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleCloseEditReviewPopup}
              className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 text-center"
            >
              Edit
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default CommentDashboard;
