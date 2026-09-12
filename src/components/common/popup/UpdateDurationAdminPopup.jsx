import React, { useContext } from "react";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { DurationContext } from "../../../context/DurationContext";

const UpdateDurationAdminPopup = () => {
  const {
    durationData,
    setDurationData,
    openDurationPopup,
    handleCloseDurationPopup,
    handleUpdateDuration,
  } = useContext(DurationContext);

  return (
    <Dialog open={openDurationPopup} onClose={handleCloseDurationPopup}>
      <form
        onSubmit={handleUpdateDuration}
        className=" flex flex-col gap-5 sm:min-w-[500px] p-5 "
      >
        <div className=" flex items-start justify-between gap-6 w-full">
          <div className=" flex flex-col gap-1">
            <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
              Update duration
            </h1>
            <p className=" text-sm text-stone-500 font-work-sans">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Sed
              accusantium explicabo iure unde ipsum facilis?
            </p>
          </div>
          <MdClose
            onClick={handleCloseDurationPopup}
            className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
          />
        </div>
        <div className=" flex flex-col gap-2 font-inter">
          <input
            type="number"
            placeholder="Level 1 Duration (in seconds)"
            name="level1Duration"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setDurationData({
                ...durationData,
                level1Duration: e.target.value,
              })
            }
            value={durationData.level1Duration}
          />
          <input
            type="number"
            placeholder="Level 2 Duration (in seconds)"
            name="level2Duration"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setDurationData({
                ...durationData,
                level2Duration: e.target.value,
              })
            }
            value={durationData.level2Duration}
          />
          <input
            type="number"
            placeholder="Level 3 Duration (in seconds)"
            name="level3Duration"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setDurationData({
                ...durationData,
                level3Duration: e.target.value,
              })
            }
            value={durationData.level3Duration}
          />
          <input
            type="number"
            placeholder="Level 4 Duration (in seconds)"
            name="level4Duration"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setDurationData({
                ...durationData,
                level4Duration: e.target.value,
              })
            }
            value={durationData.level4Duration}
          />
        </div>
        <div className=" grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={handleCloseDurationPopup}
            className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Submit
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default UpdateDurationAdminPopup;
