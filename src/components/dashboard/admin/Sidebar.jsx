// import React, { useContext } from "react";
// import { RiDashboardHorizontalLine } from "react-icons/ri";
// import { RiDashboardHorizontalFill } from "react-icons/ri";
// import { TbBooks } from "react-icons/tb";
// import { ImBooks } from "react-icons/im";
// import { IoNewspaperOutline } from "react-icons/io5";
// import { IoNewspaper } from "react-icons/io5";
// import { FaRegUser } from "react-icons/fa";
// import { FaUser } from "react-icons/fa";
// import { IoDocumentLockOutline } from "react-icons/io5";
// import { IoDocumentLock } from "react-icons/io5";
// import { FiLogOut } from "react-icons/fi";
// import { TbSettings } from "react-icons/tb";
// import { TbSettingsFilled } from "react-icons/tb";
// import { IoMailOutline } from "react-icons/io5";
// import { IoMailSharp } from "react-icons/io5";
// import { IoAddCircleOutline } from "react-icons/io5";
// import { IoAddCircle } from "react-icons/io5";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { AuthContext } from "../../../context/AuthContext";
// import { MdOutlineRateReview, MdRateReview } from "react-icons/md";
// import axios from "axios";
// import toast from "react-hot-toast";

// const Sidebar = () => {
//   const { userData, setUserData } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const handleLogout = async () => {
//     try {
//       const response = await axios.post(
//         `${import.meta.env.VITE_APP_API_URL}/users/logout`,
//         {},
//         { withCredentials: true }
//       );
//       const { data } = response;
//       if (data) {
//         setUserData(null);
//         navigate("/login");
//       }
//     } catch (error) {
//       toast.error("Logout failed");
//     }
//   };

//   return (
//     <div className=" flex flex-col justify-between gap-6 bg-indigo-500 rounded-3xl min-w-[280px] h-[95vh] sticky top-5 overflow-y-auto hide-scrollbar">
//       <div className=" flex flex-col gap-5">
//         <div className=" p-6 ">
//           <h1 className=" text-stone-50 font-bold text-3xl font-manrope">
//             <span className="">Dr. A. D. Academy </span>
//             <br />
//             of Excellence
//           </h1>
//         </div>
//         <div className=" flex flex-col gap-3">
//           <h1 className=" text-[13px] text-stone-50 font-medium px-6">MENU</h1>
//           <div className=" flex flex-col gap-[10px] font-inter ">
//             <div className=" flex items-center ">
//               <div
//                 className={` h-10 w-2 ${
//                   location.pathname === "/dashboard" ||
//                   location.pathname === "/dashboard/"
//                     ? " bg-stone-50"
//                     : " bg-indigo-500"
//                 } rounded-tr-full rounded-br-full`}
//               ></div>
//               <Link
//                 to={"/dashboard"}
//                 className={` flex items-center gap-2 px-[17px] ${
//                   location.pathname === "/dashboard" ||
//                   location.pathname === "/dashboard/"
//                     ? " text-stone-50"
//                     : " text-indigo-100 hover:opacity-80 duration-300"
//                 }`}
//               >
//                 {location.pathname === "/dashboard" ||
//                 location.pathname === "/dashboard/" ? (
//                   <RiDashboardHorizontalFill className=" text-2xl" />
//                 ) : (
//                   <RiDashboardHorizontalLine className=" text-2xl" />
//                 )}
//                 <h2 className=" font-medium text-lg">Dashboard</h2>
//               </Link>
//             </div>
//             {userData.role === "admin" && (
//               <>
//                 <div className=" flex items-center ">
//                   <div
//                     className={` h-10 w-2 ${
//                       location.pathname === "/dashboard/create-subject" ||
//                       location.pathname === "/dashboard/create-subject/"
//                         ? " bg-stone-50"
//                         : " bg-indigo-500"
//                     } rounded-tr-full rounded-br-full`}
//                   ></div>
//                   <Link
//                     to={"/dashboard/create-subject"}
//                     className={` flex items-center gap-2 px-[17px] ${
//                       location.pathname === "/dashboard/create-subject" ||
//                       location.pathname === "/dashboard/create-subject/"
//                         ? " text-stone-50"
//                         : " text-indigo-100 hover:opacity-80 duration-300"
//                     }`}
//                   >
//                     {location.pathname === "/dashboard/create-subject" ||
//                     location.pathname === "/dashboard/create-subject/" ? (
//                       <ImBooks className=" text-2xl text-stone-50 ml-[3px]" />
//                     ) : (
//                       <TbBooks className=" text-2xl" />
//                     )}
//                     <h2 className=" font-medium text-lg">Subject</h2>
//                   </Link>
//                 </div>
//                 <div className=" flex items-center ">
//                   <div
//                     className={` h-10 w-2 ${
//                       location.pathname.startsWith("/dashboard/exam")
//                         ? " bg-[#fafafa]"
//                         : " bg-indigo-500"
//                     } rounded-tr-full rounded-br-full`}
//                   ></div>
//                   <Link
//                     to={"/dashboard/exam"}
//                     className={` flex items-center gap-2 px-[17px] ${
//                       location.pathname.startsWith("/dashboard/exam")
//                         ? " text-stone-50"
//                         : " text-indigo-100 hover:opacity-80 duration-300"
//                     }`}
//                   >
//                     {location.pathname.startsWith("/dashboard/exam") ? (
//                       <IoNewspaper className=" text-2xl" />
//                     ) : (
//                       <IoNewspaperOutline className=" text-2xl " />
//                     )}
//                     <h2 className=" font-medium text-lg">Exam</h2>
//                   </Link>
//                 </div>
//                 <div className=" flex items-center ">
//                   <div
//                     className={` h-10 w-2 ${
//                       location.pathname === "/dashboard/users" ||
//                       location.pathname === "/dashboard/users/"
//                         ? " bg-stone-50"
//                         : " bg-indigo-500"
//                     } rounded-tr-full rounded-br-full`}
//                   ></div>
//                   <Link
//                     to={"/dashboard/users"}
//                     className={` flex items-center gap-3 px-[17px] ${
//                       location.pathname === "/dashboard/users" ||
//                       location.pathname === "/dashboard/users/"
//                         ? " text-stone-50"
//                         : " text-indigo-100 hover:opacity-80 duration-300"
//                     }`}
//                   >
//                     {location.pathname === "/dashboard/users" ||
//                     location.pathname === "/dashboard/users/" ? (
//                       <FaUser className=" text-xl" />
//                     ) : (
//                       <FaRegUser className=" text-xl " />
//                     )}
//                     <h2 className=" font-medium text-lg">Users</h2>
//                   </Link>
//                 </div>
//                 <div className=" flex items-center ">
//                   <div
//                     className={` h-10 w-2 ${
//                       location.pathname === "/dashboard/controllers" ||
//                       location.pathname === "/dashboard/controllers/"
//                         ? " bg-stone-50"
//                         : " bg-indigo-500"
//                     } rounded-tr-full rounded-br-full`}
//                   ></div>
//                   <Link
//                     to={"/dashboard/controllers"}
//                     className={` flex items-center gap-2 px-[17px] ${
//                       location.pathname === "/dashboard/controllers" ||
//                       location.pathname === "/dashboard/controllers/"
//                         ? " text-stone-50"
//                         : " text-indigo-100 hover:opacity-80 duration-300"
//                     }`}
//                   >
//                     {location.pathname === "/dashboard/controllers" ||
//                     location.pathname === "/dashboard/controllers/" ? (
//                       <IoAddCircle className=" text-2xl" />
//                     ) : (
//                       <IoAddCircleOutline className=" text-2xl " />
//                     )}
//                     <h2 className=" font-medium text-lg">Controllers</h2>
//                   </Link>
//                 </div>
//                 <div className=" flex items-center ">
//                   <div
//                     className={` h-10 w-2 ${
//                       location.pathname === "/dashboard/trigger-mail" ||
//                       location.pathname === "/dashboard/trigger-mail/"
//                         ? " bg-stone-50"
//                         : " bg-indigo-500"
//                     } rounded-tr-full rounded-br-full`}
//                   ></div>
//                   <Link
//                     to={"/dashboard/trigger-mail"}
//                     className={` flex items-center gap-2 px-[17px] ${
//                       location.pathname === "/dashboard/trigger-mail" ||
//                       location.pathname === "/dashboard/trigger-mail/"
//                         ? " text-stone-50"
//                         : " text-indigo-100 hover:opacity-80 duration-300"
//                     }`}
//                   >
//                     {location.pathname === "/dashboard/trigger-mail" ||
//                     location.pathname === "/dashboard/trigger-mail/" ? (
//                       <IoMailSharp className=" text-2xl" />
//                     ) : (
//                       <IoMailOutline className=" text-2xl " />
//                     )}
//                     <h2 className=" font-medium text-lg">Trigger Mail</h2>
//                   </Link>
//                 </div>
//               </>
//             )}
//             {(userData.role === "evaluator" || userData.role === "admin") && (
//               <div className=" flex items-center ">
//                 <div
//                   className={` h-10 w-2 ${
//                     location.pathname === "/dashboard/comment" ||
//                     location.pathname === "/dashboard/comment/"
//                       ? " bg-stone-50"
//                       : " bg-indigo-500"
//                   } rounded-tr-full rounded-br-full`}
//                 ></div>
//                 <Link
//                   to={"/dashboard/comment"}
//                   className={` flex items-center gap-2 px-[17px] ${
//                     location.pathname === "/dashboard/comment" ||
//                     location.pathname === "/dashboard/comment/"
//                       ? " text-stone-50"
//                       : " text-indigo-100 hover:opacity-80 duration-300"
//                   }`}
//                 >
//                   {location.pathname === "/dashboard/comment" ||
//                   location.pathname === "/dashboard/comment/" ? (
//                     <MdRateReview className=" text-2xl" />
//                   ) : (
//                     <MdOutlineRateReview className=" text-2xl " />
//                   )}
//                   <h2 className=" font-medium text-lg">Comment</h2>
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       <div className=" flex flex-col gap-3 pb-5">
//         <h1 className=" text-[13px] text-stone-100 font-medium px-6">
//           GENERAL
//         </h1>
//         <div className=" flex flex-col gap-[10px] font-inter ">
//           {/* <div className=" flex items-center ">
//             <div
//               className={` h-10 w-2 ${
//                 location.pathname === "/dashboard/settings" ||
//                 location.pathname === "/dashboard/settings/"
//                   ? " bg-stone-50"
//                   : " bg-indigo-500"
//               } rounded-tr-full rounded-br-full`}
//             ></div>
//             <Link
//               to={"/dashboard/settings"}
//               className={` flex items-center gap-2 px-[17px] ${
//                 location.pathname === "/dashboard/settings" ||
//                 location.pathname === "/dashboard/settings/"
//                   ? " text-stone-50"
//                   : " text-indigo-100 hover:opacity-80 duration-300"
//               }`}
//             >
//               {location.pathname === "/dashboard/settings" ||
//               location.pathname === "/dashboard/settings/" ? (
//                 <TbSettingsFilled className=" text-2xl" />
//               ) : (
//                 <TbSettings className=" text-2xl " />
//               )}
//               <h2 className=" font-medium text-lg">Settings</h2>
//             </Link>
//           </div> */}
//           <div className=" flex items-center text-stone-100">
//             <div
//               className={` h-10 w-2 bg-indigo-500 rounded-tr-full rounded-br-full`}
//             ></div>
//             <div
//               className=" flex items-center gap-2 px-[17px] cursor-pointer text-stone-50"
//               onClick={handleLogout}
//             >
//               <FiLogOut className=" text-2xl" />
//               <h2 className=" font-medium text-lg">Logout</h2>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useContext, useState, useEffect } from "react";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { RiDashboardHorizontalFill } from "react-icons/ri";
import { TbBooks } from "react-icons/tb";
import { ImBooks } from "react-icons/im";
import { IoNewspaperOutline } from "react-icons/io5";
import { IoNewspaper } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { IoDocumentLockOutline } from "react-icons/io5";
import { IoDocumentLock } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { TbSettings } from "react-icons/tb";
import { TbSettingsFilled } from "react-icons/tb";
import { IoMailOutline } from "react-icons/io5";
import { IoMailSharp } from "react-icons/io5";
import { IoAddCircleOutline } from "react-icons/io5";
import { IoAddCircle } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { MdOutlineRateReview, MdRateReview } from "react-icons/md";
import { MdOutlineFactCheck, MdFactCheck } from "react-icons/md";
import { Images } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { userData, setUserData, handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // const handleLogout = async () => {
  //   try {
  //     const response = await axios.post(
  //       `${import.meta.env.VITE_APP_API_URL}/users/logout`,
  //       {},
  //       { withCredentials: true }
  //     );
  //     const { data } = response;
  //     if (data) {
  //       setUserData(null);
  //       navigate("/login");
  //     }
  //   } catch (error) {
  //     toast.error("Logout failed");
  //   }
  // };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const SidebarContent = () => {
    // Check if we should show collapsed version based on screen size
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const showCollapsed = isCollapsed || windowWidth < 1280; // xl breakpoint is 1280px

    return (
      <>
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="p-6">
            <h1
              className={`text-stone-50 font-bold font-manrope transition-all duration-300 ${
                showCollapsed
                  ? "text-base sm:text-lg xl:text-xl text-center leading-tight"
                  : "text-3xl"
              }`}
            >
              {showCollapsed ? (
                <span className="block">Dr. A.D.</span>
              ) : (
                <>
                  <span>Dr. A. D. Academy </span>
                  <br />
                  of Excellence
                </>
              )}
            </h1>
          </div>

          {/* Menu Section */}
          <div className="flex flex-col gap-3">
            <h1
              className={`text-[13px] text-stone-50 font-medium px-6 transition-all duration-300 ${
                showCollapsed ? "text-center text-[10px] sm:text-[11px]" : ""
              }`}
            >
              {showCollapsed ? "" : "MENU"}
            </h1>
            <div className="flex flex-col gap-[10px] font-inter">
              {/* Admin Only Items */}
              {userData.role === "admin" && (
                <>
                  {/* Dashboard */}
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard" ||
                        location.pathname === "/dashboard/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard" ||
                        location.pathname === "/dashboard/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Dashboard" : ""}
                    >
                      {location.pathname === "/dashboard" ||
                      location.pathname === "/dashboard/" ? (
                        <RiDashboardHorizontalFill
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      ) : (
                        <RiDashboardHorizontalLine
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Exam Dashboard</h2>
                      )}
                    </Link>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard/user-based" ||
                        location.pathname === "/dashboard/user-based/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/user-based"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard/user-based" ||
                        location.pathname === "/dashboard/user-based/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Dashboard" : ""}
                    >
                      {location.pathname === "/dashboard/user-based" ||
                      location.pathname === "/dashboard/user-based/" ? (
                        <RiDashboardHorizontalFill
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      ) : (
                        <RiDashboardHorizontalLine
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">User Dashboard</h2>
                      )}
                    </Link>
                  </div>
                  {/* Subject */}
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard/create-subject" ||
                        location.pathname === "/dashboard/create-subject/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/create-subject"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard/create-subject" ||
                        location.pathname === "/dashboard/create-subject/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Subject" : ""}
                    >
                      {location.pathname === "/dashboard/create-subject" ||
                      location.pathname === "/dashboard/create-subject/" ? (
                        <ImBooks
                          className={`text-stone-50 ${
                            showCollapsed
                              ? "text-xl sm:text-2xl ml-0"
                              : "text-2xl ml-[3px]"
                          }`}
                        />
                      ) : (
                        <TbBooks
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Subject</h2>
                      )}
                    </Link>
                  </div>

                  {/* Exam */}
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname.startsWith("/dashboard/exam")
                          ? "bg-[#fafafa]"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/exam"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname.startsWith("/dashboard/exam")
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Exam" : ""}
                    >
                      {location.pathname.startsWith("/dashboard/exam") ? (
                        <IoNewspaper
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      ) : (
                        <IoNewspaperOutline
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Exam</h2>
                      )}
                    </Link>
                  </div>

                  {/* Users */}
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard/users" ||
                        location.pathname === "/dashboard/users/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/users"}
                      className={`flex items-center gap-3 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard/users" ||
                        location.pathname === "/dashboard/users/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2 gap-0" : ""}`}
                      title={showCollapsed ? "Users" : ""}
                    >
                      {location.pathname === "/dashboard/users" ||
                      location.pathname === "/dashboard/users/" ? (
                        <FaUser
                          className={`${
                            showCollapsed ? "text-lg sm:text-xl" : "text-xl"
                          }`}
                        />
                      ) : (
                        <FaRegUser
                          className={`${
                            showCollapsed ? "text-lg sm:text-xl" : "text-xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Users</h2>
                      )}
                    </Link>
                  </div>

                  {/* Controllers */}
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard/controllers" ||
                        location.pathname === "/dashboard/controllers/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/controllers"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard/controllers" ||
                        location.pathname === "/dashboard/controllers/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Controllers" : ""}
                    >
                      {location.pathname === "/dashboard/controllers" ||
                      location.pathname === "/dashboard/controllers/" ? (
                        <IoAddCircle
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      ) : (
                        <IoAddCircleOutline
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Controllers</h2>
                      )}
                    </Link>
                  </div>

                  {/* Test Tracking */}
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard/test-tracking" ||
                        location.pathname === "/dashboard/test-tracking/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/test-tracking"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard/test-tracking" ||
                        location.pathname === "/dashboard/test-tracking/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Test Tracking" : ""}
                    >
                      {location.pathname === "/dashboard/test-tracking" ||
                      location.pathname === "/dashboard/test-tracking/" ? (
                        <MdFactCheck
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      ) : (
                        <MdOutlineFactCheck
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Test Tracking</h2>
                      )}
                    </Link>
                  </div>

                  {/* Content Management */}
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard/content" ||
                        location.pathname === "/dashboard/content/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/content"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard/content" ||
                        location.pathname === "/dashboard/content/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Content" : ""}
                    >
                      <Images
                        className={`${
                          showCollapsed
                            ? "w-5 h-5 sm:w-6 sm:h-6"
                            : "w-6 h-6"
                        }`}
                      />
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Content</h2>
                      )}
                    </Link>
                  </div>

                  {/* Trigger Mail */}
                  {/* <div className="flex items-center">
                    <div
                      className={`h-10 w-2 ${
                        location.pathname === "/dashboard/trigger-mail" ||
                        location.pathname === "/dashboard/trigger-mail/"
                          ? "bg-stone-50"
                          : "bg-indigo-500"
                      } rounded-tr-full rounded-br-full`}
                    ></div>
                    <Link
                      to={"/dashboard/trigger-mail"}
                      className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                        location.pathname === "/dashboard/trigger-mail" ||
                        location.pathname === "/dashboard/trigger-mail/"
                          ? "text-stone-50"
                          : "text-indigo-100 hover:opacity-80 duration-300"
                      } ${showCollapsed ? "justify-center px-2" : ""}`}
                      title={showCollapsed ? "Trigger Mail" : ""}
                    >
                      {location.pathname === "/dashboard/trigger-mail" ||
                      location.pathname === "/dashboard/trigger-mail/" ? (
                        <IoMailSharp
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      ) : (
                        <IoMailOutline
                          className={`${
                            showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                          }`}
                        />
                      )}
                      {!showCollapsed && (
                        <h2 className="font-medium text-lg">Trigger Mail</h2>
                      )}
                    </Link>
                  </div> */}
                </>
              )}

              {/* Comment (for evaluator and admin) */}
              {(userData.role === "evaluator" || userData.role === "admin") && (
                <div className="flex items-center">
                  <div
                    className={`h-10 w-2 ${
                      location.pathname === "/dashboard/comment" ||
                      location.pathname === "/dashboard/comment/"
                        ? "bg-stone-50"
                        : "bg-indigo-500"
                    } rounded-tr-full rounded-br-full`}
                  ></div>
                  <Link
                    to={"/dashboard/comment"}
                    className={`flex items-center gap-2 px-[17px] transition-all duration-300 ${
                      location.pathname === "/dashboard/comment" ||
                      location.pathname === "/dashboard/comment/"
                        ? "text-stone-50"
                        : "text-indigo-100 hover:opacity-80 duration-300"
                    } ${showCollapsed ? "justify-center px-2" : ""}`}
                    title={showCollapsed ? "Comment" : ""}
                  >
                    {location.pathname === "/dashboard/comment" ||
                    location.pathname === "/dashboard/comment/" ? (
                      <MdRateReview
                        className={`${
                          showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                        }`}
                      />
                    ) : (
                      <MdOutlineRateReview
                        className={`${
                          showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                        }`}
                      />
                    )}
                    {!showCollapsed && (
                      <h2 className="font-medium text-lg">Comment</h2>
                    )}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* General Section */}
        <div className="flex flex-col gap-3 pb-5">
          <h1
            className={`text-[13px] text-stone-100 font-medium px-6 transition-all duration-300 ${
              showCollapsed ? "text-center text-[10px] sm:text-[11px]" : ""
            }`}
          >
            {showCollapsed ? "" : "GENERAL"}
          </h1>
          <div className="flex flex-col gap-[10px] font-inter">
            {/* Logout */}
            <div className="flex items-center text-stone-100">
              <div className="h-10 w-2 bg-indigo-500 rounded-tr-full rounded-br-full"></div>
              <div
                className={`flex items-center gap-2 px-[17px] cursor-pointer text-stone-50 hover:opacity-80 duration-300 transition-all ${
                  showCollapsed ? "justify-center px-2" : ""
                }`}
                onClick={handleLogout}
                title={showCollapsed ? "Logout" : ""}
              >
                <FiLogOut
                  className={`${
                    showCollapsed ? "text-xl sm:text-2xl" : "text-2xl"
                  }`}
                />
                {!showCollapsed && (
                  <h2 className="font-medium text-lg">Logout</h2>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className={`flex flex-col justify-between gap-6 bg-indigo-500 rounded-3xl h-[95vh] sticky top-5 overflow-y-auto hide-scrollbar transition-all duration-300 ${
        // Mobile: always collapsed (icon-only)
        // Tablet: medium width
        // Desktop: full width or collapsed based on state
        "min-w-[70px] sm:w-[70px] md:min-w-[80px] md:w-[80px] lg:min-w-[90px] lg:w-[90px]" +
        " xl:" +
        (isCollapsed
          ? "min-w-[90px] xl:w-[90px]"
          : "min-w-[280px] xl:w-[280px]")
      }`}
    >
      {/* Desktop Collapse Button - only show on xl screens */}
      <button
        onClick={toggleCollapse}
        className="hidden xl:block absolute top-6 right-4 p-1 text-stone-50 bg-indigo-400 hover:bg-indigo-600 rounded-full transition-colors duration-200 z-10 cursor-pointer"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        )}
      </button>
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
