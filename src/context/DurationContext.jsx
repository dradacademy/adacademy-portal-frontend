import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export const DurationContext = createContext();

export const DurationContextProvider = ({ children }) => {
  const [durationData, setDurationData] = useState({
    level1Duration: "",
    level2Duration: "",
    level3Duration: "",
    level4Duration: "",
  });

  const [openDurationPopup, setOpenDurationPopup] = useState(false);

  const fetchDurationData = async () => {
    try {
      const response = await api.get(
        `${import.meta.env.VITE_APP_API_URL}/duration/get`,
        durationData
      );
      if (response.data) {
        setDurationData(response.data);
      }
    } catch (error) {
      console.error("Error fetching duration data:", error);
    }
  };

  useEffect(() => {
    fetchDurationData();
  }, []);

  const handleOpenDurationPopup = () => {
    setOpenDurationPopup(true);
  };
  const handleCloseDurationPopup = () => {
    setOpenDurationPopup(false);
    fetchDurationData();
  };

  const handleUpdateDuration = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(
        `${import.meta.env.VITE_APP_API_URL}/duration/update`,
        durationData
      );
      if (response.data) {
        setDurationData(response.data);
        setOpenDurationPopup(false);
      }
    } catch (error) {
      console.error("Error updating duration data:", error);
      toast.error("Failed to update duration. Please try again.");
    }
  };

  return (
    <DurationContext.Provider
      value={{
        openDurationPopup,
        setOpenDurationPopup,
        handleOpenDurationPopup,
        handleCloseDurationPopup,
        durationData,
        setDurationData,
        handleUpdateDuration,
      }}
    >
      {children}
    </DurationContext.Provider>
  );
};
