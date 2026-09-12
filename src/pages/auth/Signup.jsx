import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import login_img from "../../assets/images/common/login_img.svg";
import { IoEyeOutline } from "react-icons/io5";
import { IoEyeOffOutline } from "react-icons/io5";
import { AuthContext } from "../../context/AuthContext";

const Signup = () => {
  const { signupFormData, setSignupFormData, handleSubmitRegisterUser } =
    useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setSignupFormData({
      ...signupFormData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className=" min-h-screen h-full grid grid-cols-2 justify-between gap-5 p-5">
      <div className=" relative bg-indigo-400 flex items-center justify-center rounded-3xl">
        <img src={login_img} className=" w-[50%]" alt="" />
      </div>
      <div className=" grid grid-rows-8 gap-4">
        <form
          onSubmit={handleSubmitRegisterUser}
          className=" row-span-7 flex flex-col gap-5 bg-[#f3f3f3] rounded-3xl pt-12 pb-14 pl-16 pr-28"
        >
          <h1 className=" text-stone-800 font-bold text-2xl font-manrope">
            Dr. A. D. Academy of Excellence
          </h1>
          <h2 className=" flex flex-col gap-2 text-5xl text-stone-800 font-semibold font-poppins">
            <span>Welcome to</span>
            <span>Dr. A. D. Academy of Excellence</span>
          </h2>
          <p className=" text-stone-500 font-medium font-inter">
            Your trusted platform for smooth online exams and assessments.
            Whether you're a student or an instructor, we ensure a secure and
            user-friendly experience.
          </p>
          <div className=" flex flex-col gap-3 font-inter text-stone-600 ">
            <input
              type="text"
              name="registerNumber"
              id="registerNumber"
              className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
              placeholder="Register Number"
              onChange={handleChange}
              value={signupFormData.registerNumber}
              required
            />
            <input
              type="text"
              placeholder="Username"
              name="username"
              className=" border border-stone-300 py-[10px] px-6 focus:outline-stone-300 rounded-4xl bg-stone-50 placeholder:font-medium"
              onChange={handleChange}
              value={signupFormData.username}
              required
            />{" "}
            <input
              type="email"
              placeholder="Email Address"
              name="email"
              className=" border border-stone-300 py-[10px] px-6 focus:outline-stone-300 rounded-4xl bg-stone-50 placeholder:font-medium"
              onChange={handleChange}
              value={signupFormData.email}
              required
            />
            <div className=" relative w-full h-fit">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                className=" border border-stone-300 py-[10px] px-6 focus:outline-stone-300 rounded-4xl bg-stone-50 placeholder:font-medium w-full"
                onChange={handleChange}
                value={signupFormData.password}
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
          <button
            type="submit"
            className=" bg-indigo-400 text-stone-50 font-medium py-[10px] px-5 rounded-4xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Sign up
          </button>
        </form>
        <div className="bg-[#f3f3f3] flex items-center rounded-3xl w-full h-full">
          <div className=" flex gap-5 items-center justify-center w-full px-20">
            <h2 className=" font-medium text-stone-700 font-inter">
              Already have an account?
            </h2>
            <Link
              to="/login"
              className=" bg-indigo-400 text-stone-50 font-medium pt-1.5 pb-2 px-4 rounded-md text-sm font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
