import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export const ExamContext = createContext();

export const ExamContextProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get(
        `${import.meta.env.VITE_APP_API_URL}/subjects/get`
      );

      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <ExamContext.Provider
      value={{
        subjects,
        setSubjects,
        subtopics,
        setSubtopics,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};
