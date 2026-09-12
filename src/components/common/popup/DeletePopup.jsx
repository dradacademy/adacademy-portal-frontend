import React, { useContext } from "react";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { AuthContext } from "../../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const DeletePopup = ({
  userDeletePopupData,
  showUserDeletePopup,
  handleCloseDeletePopup,
}) => {
  const { SetAllUsersData } = useContext(AuthContext);

  const handleDeleteUser = async () => {
    if (!userDeletePopupData._id) {
      toast.error("User ID is missing.");
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/admin/delete-user/${
          userDeletePopupData._id
        }`
      );
      if (response.data.success) {
        toast.success("User deleted successfully.");
        SetAllUsersData((prevUsers) =>
          prevUsers.filter((user) => user._id !== userDeletePopupData._id)
        );
        handleCloseDeletePopup();
      } else {
        toast.error(response.data.message || "Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting the user.");
    }
  };

  return (
    <Dialog open={showUserDeletePopup} onClose={handleCloseDeletePopup}>
      <div className=" flex flex-col gap-5 sm:min-w-[500px] p-5 ">
        <div className=" flex items-start justify-between gap-6 w-full">
          <div className=" flex flex-col gap-1">
            <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
              Delete User
            </h1>
            <p className=" text-sm text-stone-500 font-work-sans">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
          </div>
          <MdClose
            onClick={handleCloseDeletePopup}
            className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
          />
        </div>
        <div className=" flex flex-col gap-2 font-inter"></div>
        <div className=" grid grid-cols-2 gap-1">
          <button
            onClick={handleCloseDeletePopup}
            className=" border border-red-400 text-red-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteUser}
            className=" bg-red-400 hover:bg-red-600 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Submit
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default DeletePopup;
