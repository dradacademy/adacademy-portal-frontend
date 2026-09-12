import React, { useContext } from "react";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { DurationContext } from "../../../context/DurationContext";
import { MarkContext } from "../../../context/MarkContext";

const UpdateMarkAdminPopup = () => {
  const {
    markData,
    setMarkData,
    openMarkPopup,
    handleCloseMarkPopup,
    handleUpdateMark,
  } = useContext(MarkContext);

  return (
    <Dialog open={openMarkPopup} onClose={handleCloseMarkPopup}>
      <form
        onSubmit={handleUpdateMark}
        className=" flex flex-col gap-5 sm:min-w-[500px] p-5 "
      >
        <div className=" flex items-start justify-between gap-6 w-full">
          <div className=" flex flex-col gap-1">
            <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
              Update mark
            </h1>
            <p className=" text-sm text-stone-500 font-work-sans">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Sed
              accusantium explicabo iure unde ipsum facilis?
            </p>
          </div>
          <MdClose
            onClick={handleCloseMarkPopup}
            className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
          />
        </div>
        <div className=" grid grid-cols-2 gap-2 font-inter">
          <input
            type="number"
            placeholder="Level 1 Mark"
            name="level1Mark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level1Mark: e.target.value,
              })
            }
            value={markData.level1Mark}
          />
          <input
            type="number"
            placeholder="Level 1 Negative Mark"
            name="level1NegativeMark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level1NegativeMark: e.target.value,
              })
            }
            value={markData.level1NegativeMark}
          />
          <input
            type="number"
            placeholder="Level 2 Mark"
            name="level2Mark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level2Mark: e.target.value,
              })
            }
            value={markData.level2Mark}
          />
          <input
            type="number"
            placeholder="Level 2 Negative Mark"
            name="level2NegativeMark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level2NegativeMark: e.target.value,
              })
            }
            value={markData.level2NegativeMark}
          />
          <input
            type="number"
            placeholder="Level 3 Mark"
            name="level3Mark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level3Mark: e.target.value,
              })
            }
            value={markData.level3Mark}
          />
          <input
            type="number"
            placeholder="Level 3 Negative Mark"
            name="level3NegativeMark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level3NegativeMark: e.target.value,
              })
            }
            value={markData.level3NegativeMark}
          />
          <input
            type="number"
            placeholder="Level 4 Mark"
            name="level4Mark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level4Mark: e.target.value,
              })
            }
            value={markData.level4Mark}
          />
          <input
            type="number"
            placeholder="Level 4 Negative Mark"
            name="level4NegativeMark"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            onChange={(e) =>
              setMarkData({
                ...markData,
                level4NegativeMark: e.target.value,
              })
            }
            value={markData.level4NegativeMark}
          />
        </div>
        <div className=" grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={handleCloseMarkPopup}
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

export default UpdateMarkAdminPopup;
