import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export const MarkContext = createContext();

export const MarkContextProvider = ({ children }) => {
  const [markData, setMarkData] = useState({
    level1Mark: 0,
    level1NegativeMark: 0,
    level2Mark: 0,
    level2NegativeMark: 0,
    level3Mark: 0,
    level3NegativeMark: 0,
    level4Mark: 0,
    level4NegativeMark: 0,
  });

  const [openMarkPopup, setOpenMarkPopup] = useState(false);

  const fetchMarkData = async () => {
    try {
      const response = await api.get(
        `${import.meta.env.VITE_APP_API_URL}/mark/get`,
        markData
      );
      if (response.data) {
        setMarkData(response.data);
      }
    } catch (error) {
      console.error("Error fetching mark data:", error);
    }
  };

  useEffect(() => {
    fetchMarkData();
  }, []);

  const handleOpenMarkPopup = () => {
    setOpenMarkPopup(true);
  };
  const handleCloseMarkPopup = () => {
    setOpenMarkPopup(false);
    fetchMarkData();
  };

  const handleUpdateMark = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(
        `${import.meta.env.VITE_APP_API_URL}/mark/update`,
        markData
      );
      if (response.data) {
        setMarkData(response.data);
        setOpenMarkPopup(false);
      }
    } catch (error) {
      console.error("Error updating mark data:", error);
      toast.error("Failed to update mark. Please try again.");
    }
  };

  return (
    <MarkContext.Provider
      value={{
        openMarkPopup,
        setOpenMarkPopup,
        handleOpenMarkPopup,
        handleCloseMarkPopup,
        markData,
        setMarkData,
        handleUpdateMark,
      }}
    >
      {children}
    </MarkContext.Provider>
  );
};
