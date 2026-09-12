import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import login_img from "../../assets/images/common/login_img.svg";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const { loginFormData, setLoginFormData, handleSubmitLoginUser } =
    useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen h-full grid grid-cols-1 lg:grid-cols-2 justify-between gap-5 p-4 md:p-8 lg:p-3 xl:p-12">
      <div className=" hidden lg:flex relative bg-indigo-500 items-center justify-center rounded-3xl p-4">
        <img
          src={login_img}
          className="w-[60%] md:w-[50%] max-w-xs md:max-w-full"
          alt=""
        />
      </div>

      <form
        onSubmit={handleSubmitLoginUser}
        className="flex flex-col justify-center gap-6 bg-white rounded-3xl pt-10 pb-14 px-6 sm:px-10 md:pt-14 md:pb-20 xl:pl-16 xl:pr-28"
      >
        <h1 className="text-stone-800 font-bold text-xl md:text-2xl font-manrope">
          Dr. A. D. Academy of Excellence
        </h1>
        <h2 className="flex flex-col gap-2 text-3xl md:text-5xl text-stone-800 font-semibold font-poppins">
          <span>Welcome to Dr. A. D. Academy of Excellence</span>
        </h2>
        <p className="text-stone-500 font-medium font-inter text-sm md:text-base">
          Your trusted platform for smooth online exams and assessments. Whether
          you're a student or an instructor, we ensure a secure and
          user-friendly experience.
        </p>
        <div className="flex flex-col gap-3 font-inter text-stone-600 w-full">
          <input
            type="text"
            placeholder="Register Number"
            name="registerNumber"
            className="border border-stone-300 bg-white py-[10px] px-6 focus:outline-none rounded-4xl placeholder:font-medium w-full"
            onChange={handleChange}
            value={loginFormData.registerNumber}
          />
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            className="border border-stone-300 bg-white py-[10px] px-6 focus:outline-none rounded-4xl placeholder:font-medium w-full"
            onChange={handleChange}
            value={loginFormData.email}
            required
          />
          <div className="relative w-full h-fit">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              className="border border-stone-300 bg-white py-[10px] px-6 focus:outline-none rounded-4xl placeholder:font-medium w-full"
              onChange={handleChange}
              value={loginFormData.password}
              required
            />
            <div className="absolute top-1 bottom-1.5 right-6 text-xl text-stone-400">
              <div className="flex items-center justify-center w-full h-full">
                {showPassword ? (
                  <IoEyeOutline
                    className="cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                ) : (
                  <IoEyeOffOutline
                    className="cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="bg-indigo-500 text-stone-50 font-medium py-[10px] px-5 rounded-4xl font-poppins cursor-pointer hover:opacity-85 duration-300 w-full"
        >
          Sign in
        </button>
      </form>
    </div>
  );
};

export default Login;
