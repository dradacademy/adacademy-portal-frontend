import { Dialog } from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { MdClose } from "react-icons/md";
import Select from "react-select";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/lara-light-blue/theme.css";
import PasswordChangeAdminPopup from "../../../../components/common/popup/PasswordChangeAdminPopup";
import BulkUserUploadAdmin from "../../common/BulkUserUploadAdmin";
import { AuthContext } from "../../../../context/AuthContext";
import DeletePopup from "../../../../components/common/popup/DeletePopup";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

const roleOptions = [
  { label: "Student", value: "student" },
  { label: "Evaluator", value: "evaluator" },
];

const UsersAdminPage = () => {
  const { allUsersData, SetAllUsersData } = useContext(AuthContext);
  const [userData, setUserData] = useState({
    registerNumber: "",
    username: "",
    email: "",
    password: "",
    role: "student",
    category: EXAM_CATEGORY_OPTIONS[0].value,
  });
  // Category tab — view students one exam category at a time so it's
  // immediately obvious who belongs to GATE vs. TNPSC vs. SSC/RRB.
  const [activeCategory, setActiveCategory] = useState("all");
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [userPopupData, setUserPopupData] = useState({});
  const [userDeletePopupData, setUserDeletePopupData] = useState({});
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [openUserPopup, setOpenUserPopup] = useState(false);
  const [openPasswordPopup, setOpenPasswordPopup] = useState(false);
  const [showUserDeletePopup, setShowUserDeletePopup] = useState(false);

  const handleOpenDeletePopup = (data) => {
    setShowUserDeletePopup(true);
    setUserDeletePopupData(data);
  };

  const handleCloseDeletePopup = () => {
    setShowUserDeletePopup(false);
    setUserDeletePopupData({});
  };

  const handleClickOpenUserPopup = () => {
    setOpenUserPopup(true);
  };

  const handleClickOpenPasswordPopup = (data) => {
    setOpenPasswordPopup(true);
    setUserPopupData(data);
  };

  const handleClosePasswordPopup = () => {
    setOpenPasswordPopup(false);
    setPassword("");
    setUserPopupData({});
  };

  const handleCloseUserPopup = () => {
    setOpenUserPopup(false);
    setUserData({
      registerNumber: "",
      username: "",
      email: "",
      password: "",
      role: "student",
      category: EXAM_CATEGORY_OPTIONS[0].value,
    });
  };

  const handleToggleActive = async (rowData) => {
    setTogglingUserId(rowData._id);
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/users/${rowData._id}/toggle-active`,
        { isDisabled: !rowData.isDisabled }
      );
      const updatedUser = response.data?.user || response.data?.data;
      SetAllUsersData(
        allUsersData.map((u) =>
          u._id === rowData._id
            ? { ...u, isDisabled: updatedUser?.isDisabled ?? !rowData.isDisabled }
            : u
        )
      );
      toast.success(
        !rowData.isDisabled
          ? "Student account disabled. They can no longer log in."
          : "Student account re-enabled."
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update account status"
      );
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitEditPassword = async (e) => {
    e.preventDefault();
    if (!password || !userPopupData._id) {
      toast.error("Please fill the Password Field.");
      return;
    }
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_APP_API_URL}/users/update/password/${
          userPopupData._id
        }`,
        { password: password }
      );
      const { data } = response;
      if (data) {
        toast.success("Password updated successfully");
        handleClosePasswordPopup();
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !userData.username ||
      !userData.email ||
      !userData.password ||
      !userData.role
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (userData.role === "student" && !userData.registerNumber) {
      toast.error("Please enter the register number for student.");
      return;
    }

    if (userData.role === "student" && !userData.category) {
      toast.error("Please select the exam category for this student.");
      return;
    }

    try {
      const dataToSend = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        ...(userData.role === "student" && {
          registerNumber: userData.registerNumber,
          category: userData.category,
        }),
      };
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/users/register`,
        dataToSend
      );
      const { data } = response;
      if (data) {
        SetAllUsersData(allUsersData.concat(data.user));
        setUserData({
          registerNumber: "",
          username: "",
          email: "",
          password: "",
          role: "student",
          category: EXAM_CATEGORY_OPTIONS[0].value,
        });
        toast.success("User added successfully");
        handleCloseUserPopup();
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.error);
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className=" flex items-center gap-1.5">
        <button
          onClick={() => handleClickOpenPasswordPopup(rowData)}
          className="bg-indigo-400 text-stone-50 px-3 py-1.5 rounded text-nowrap text-sm font-medium hover:bg-indigo-500 transition duration-300 cursor-pointer"
        >
          Edit Password
        </button>
        {rowData.role === "student" && (
          <button
            onClick={() => handleToggleActive(rowData)}
            disabled={togglingUserId === rowData._id}
            className={`px-3 py-1.5 rounded text-nowrap text-sm font-medium transition duration-300 cursor-pointer disabled:opacity-50 ${
              rowData.isDisabled
                ? "bg-emerald-500 text-stone-50 hover:bg-emerald-600"
                : "bg-amber-500 text-stone-50 hover:bg-amber-600"
            }`}
          >
            {rowData.isDisabled ? "Enable" : "Disable"}
          </button>
        )}
        {rowData.role !== "admin" && (
          <button
            onClick={() => handleOpenDeletePopup(rowData)}
            className="bg-red-400 text-stone-50 px-3 py-1.5 rounded text-nowrap text-sm font-medium hover:bg-red-500 transition duration-300 cursor-pointer"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  const visibleUsers =
    activeCategory === "all"
      ? allUsersData
      : allUsersData.filter(
          (u) => u.role !== "student" || u.category === activeCategory
        );

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between gap-20 font-inter">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins">
            Users
          </h1>
          <p className="text-stone-400 font-medium">
            Effortlessly manage users with the ability to create, edit, delete,
            and view them. Maintain seamless organization of exam content and
            user access.
          </p>
        </div>
        <div className=" flex items-center gap-2">
          <button
            onClick={handleClickOpenUserPopup}
            className="text-nowrap bg-indigo-500 text-stone-50 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Create User
          </button>
        </div>
      </div>
      <BulkUserUploadAdmin />

      {/* Category tabs — filter the student list by exam category so the
          admin can, e.g., work with only GATE students at a time. Admin/
          evaluator rows are unscoped and always shown. */}
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

      <DataTable
        value={visibleUsers}
        stripedRows
        removableSort
        paginator
        rows={10}
        rowsPerPageOptions={[10, 30, 60, 100, 150]}
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column field="registerNumber" header="Register No" sortable />
        <Column field="username" header="Username" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="role" header="Role" sortable />
        <Column
          field="category"
          header="Category"
          sortable
          body={(rowData) =>
            rowData.role === "student" ? getCategoryLabel(rowData.category) : "—"
          }
        />
        <Column
          field="isDisabled"
          header="Status"
          sortable
          body={(rowData) =>
            rowData.role !== "student" ? (
              "—"
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  rowData.isDisabled
                    ? "bg-red-100 text-red-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {rowData.isDisabled ? "Disabled" : "Active"}
              </span>
            )
          }
        />
        <Column
          field="createdAt"
          header="Created At"
          sortable
          body={(rowData) =>
            new Date(rowData.createdAt).toLocaleString("en-GB")
          }
        />
        <Column
          body={actionBodyTemplate}
          header="Actions"
          style={{ width: "15%" }}
        />
      </DataTable>

      <Dialog open={openUserPopup} onClose={handleCloseUserPopup}>
        <div className=" flex flex-col gap-5 sm:min-w-[500px] p-5 ">
          <div className=" flex items-start justify-between gap-6 w-full">
            <div className=" flex flex-col gap-1">
              <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
                Create User
              </h1>
              <p className=" text-sm text-stone-500 font-work-sans">
                Add a new user by filling in the required details. Assign roles
                and permissions to manage access efficiently.
              </p>
            </div>
            <MdClose
              onClick={handleCloseUserPopup}
              className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className=" flex flex-col gap-2 font-inter">
            <div className=" flex items-center gap-1">
              <Select
                className="w-full"
                options={roleOptions}
                value={roleOptions.find((opt) => opt.value === userData.role)}
                onChange={(selectedOption) =>
                  setUserData({
                    ...userData,
                    role: selectedOption.value,
                    registerNumber:
                      selectedOption.value === "student"
                        ? userData.registerNumber
                        : "",
                  })
                }
                isSearchable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "15px",
                    padding: "4px",
                    borderColor: "#ccc",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#888" },
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }), // Ensure dropdown is above other elements
                }}
                menuPortalTarget={document.body} // Render dropdown outside the modal
                menuPosition="absolute"
              />
            </div>
            {userData.role === "student" && (
              <input
                type="text"
                name="registerNumber"
                id="registerNumber"
                className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
                placeholder="Register Number"
                onChange={handleChange}
                value={userData.registerNumber}
                required
              />
            )}
            {userData.role === "student" && (
              <Select
                className="w-full"
                placeholder="Exam Category"
                options={EXAM_CATEGORY_OPTIONS}
                value={
                  EXAM_CATEGORY_OPTIONS.find(
                    (opt) => opt.value === userData.category
                  ) || null
                }
                onChange={(selectedOption) =>
                  setUserData({ ...userData, category: selectedOption.value })
                }
                isSearchable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "15px",
                    padding: "4px",
                    borderColor: "#ccc",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#888" },
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                menuPortalTarget={document.body}
                menuPosition="absolute"
              />
            )}
            <input
              type="text"
              placeholder="Username"
              name="username"
              className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
              onChange={handleChange}
              value={userData.username}
              required
            />{" "}
            <input
              type="email"
              placeholder="Email Address"
              name="email"
              className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
              onChange={handleChange}
              value={userData.email}
              required
            />
            <div className=" relative w-full h-fit">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                className=" border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white w-full"
                onChange={handleChange}
                value={userData.password}
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
              onClick={handleCloseUserPopup}
              className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Submit
            </button>
          </div>
        </div>
      </Dialog>

      <DeletePopup
        userDeletePopupData={userDeletePopupData}
        showUserDeletePopup={showUserDeletePopup}
        handleCloseDeletePopup={handleCloseDeletePopup}
      />
      <PasswordChangeAdminPopup
        openPasswordPopup={openPasswordPopup}
        handleClosePasswordPopup={handleClosePasswordPopup}
        userData={userPopupData}
        password={password}
        setPassword={setPassword}
        handleSubmitEditPassword={handleSubmitEditPassword}
      />
    </div>
  );
};

export default UsersAdminPage;
