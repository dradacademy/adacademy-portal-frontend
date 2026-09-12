import React, { useState } from "react";
import { Dialog } from "@mui/material";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { MdClose } from "react-icons/md";

const PasswordChangeAdminPopup = ({
  openPasswordPopup,
  handleClosePasswordPopup,
  userData,
  password,
  setPassword,
  handleSubmitEditPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Dialog open={openPasswordPopup} onClose={handleClosePasswordPopup}>
      <form
        onSubmit={handleSubmitEditPassword}
        className=" flex flex-col gap-5 sm:min-w-[500px] p-5 "
      >
        <div className=" flex items-start justify-between gap-6 w-full">
          <div className=" flex flex-col gap-1">
            <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
              Edit password
            </h1>
            <p className=" text-sm text-stone-500 font-work-sans">
              Update the user’s password by entering a new secure password.
              Enter a new, strong password and confirm it before saving.
            </p>
          </div>
          <MdClose
            onClick={handleClosePasswordPopup}
            className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
          />
        </div>
        <div className=" flex flex-col gap-2 font-inter">
          <input
            type="text"
            placeholder="Role"
            name="role"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            value={userData.role}
            disabled
          />
          {userData.role === "student" && (
            <input
              type="text"
              placeholder="Register Number"
              name="registerNumber"
              className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
              value={userData.registerNumber}
              disabled
            />
          )}
          <input
            type="text"
            placeholder="Username"
            name="username"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            value={userData.username}
            disabled
          />{" "}
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white disabled:bg-stone-100"
            value={userData.email}
            disabled
          />
          <div className=" relative w-full h-fit">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white w-full"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              minLength={3}
              required
            />
            <div className=" absolute top-1 bottom-1.5 right-6 text-xl text-stone-400">
              <div className=" flex items-center justify-center w-full h-full">
                {showPassword ? (
                  <IoEyeOutline
                    className=" cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                ) : (
                  <IoEyeOffOutline
                    className=" cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className=" grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={handleClosePasswordPopup}
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

export default PasswordChangeAdminPopup;
