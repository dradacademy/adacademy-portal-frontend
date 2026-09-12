import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const TriggerMailAdminPage = () => {
  const [mailDetails, setMailDetails] = useState({
    receivers: null,
    subject: "",
    body: "",
  });
  const [isSending, setIsSending] = useState(false);

  const handleChangeReceiver = (selectedOption, { name }) => {
    setMailDetails((prevDetails) => ({
      ...prevDetails,
      [name]: selectedOption,
    }));
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setMailDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleBodyChange = (value) => {
    setMailDetails((prevDetails) => ({
      ...prevDetails,
      body: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      mailDetails.receivers === null ||
      mailDetails.subject === "" ||
      mailDetails.body === ""
    ) {
      return toast.error("Fill the needed details");
    }

    const payload = {
      ...mailDetails,
      receivers: mailDetails.receivers.value,
    };

    try {
      setIsSending(true);
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/admin/trigger-mail`,
        payload
      );
      if (response.data?.error) {
        throw new Error(`Error while sending the email: ${response}`);
      }
      setMailDetails({
        receivers: null,
        subject: "",
        body: "",
      });
      toast.success("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email.");
    } finally {
      setIsSending(false); // 🔓 enable button whether success or error
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-inter">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-stone-700 font-bold font-poppins">
          Trigger Mail
        </h1>
        <p className="text-stone-400 font-medium">
          Easily send important notifications and updates to all students or
          evaluators with just a click. Keep everyone informed and engaged with
          seamless email communication.
        </p>
      </div>
      <form className=" flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          <Select
            name="receivers"
            value={mailDetails.receivers}
            onChange={handleChangeReceiver}
            options={[
              { value: "student", label: "Student" },
              { value: "evaluator", label: "Evaluator" },
            ]}
            placeholder="Select Receiver"
            className="focus:outline-none"
            styles={{
              control: (provided) => ({
                ...provided,
                boxShadow: "none",
                "&:hover": {
                  borderColor: "gray",
                },
                padding: "2px 1px",
                borderRadius: "6px",
              }),
            }}
          />
          <input
            type="text"
            placeholder="Subject"
            name="subject"
            className="border border-stone-300 py-2 px-6 focus:outline-stone-300 rounded-md bg-white placeholder:font-medium w-full"
            onChange={handleTextChange}
            value={mailDetails.subject}
            required
          />
          <div className="col-span-2 h-full">
            <ReactQuill
              name="body"
              value={mailDetails.body}
              onChange={handleBodyChange}
              placeholder="Compose your message here..."
              className=" bg-white"
            />
          </div>
        </div>
        <div className=" flex items-end justify-end">
          <button
            type="submit"
            disabled={isSending}
            className={`col-span-2 text-white py-2 px-5 rounded-md font-medium transition ${
              isSending
                ? "bg-indigo-200 cursor-not-allowed"
                : "bg-indigo-500 cursor-pointer hover:bg-indigo-400"
            }`}
          >
            {isSending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TriggerMailAdminPage;
