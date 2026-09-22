import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const Navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [allUsersData, SetAllUsersData] = useState([]);

  const [signupFormData, setSignupFormData] = useState({
    registerNumber: "",
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [loginFormData, setLoginFormData] = useState({
    registerNumber: "",
    email: "",
    password: "",
  });

  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserData(null);
        setLoading(false);
        return;
      }

      // Check if token is expired
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        localStorage.removeItem("token");
        setAuthHeader(null);
        setUserData(null);
        setLoading(false);
        Navigate("/login");
        return;
      }

      setAuthHeader(token);
      const res = await api.get(
        `${import.meta.env.VITE_APP_API_URL}/users/me`
      );
      setUserData(res.data);
    } catch (err) {
      console.log("Fetch user error:", err);
      localStorage.removeItem("token");
      setAuthHeader(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data } = await api.get(
        `${import.meta.env.VITE_APP_API_URL}/users/getall`
      );
      if (data) {
        SetAllUsersData(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching the users data");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userData?.role === "admin") {
      fetchAllUsers();
    }
  }, [userData]);

  const handleSubmitRegisterUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `${import.meta.env.VITE_APP_API_URL}/users/register`,
        signupFormData
      );
      const { data } = response;
      if (data) {
        toast.success("User registered successfully! Please login");
        setTimeout(() => {
          Navigate("/login");
        }, 1000);
        setSignupFormData({
          username: "",
          email: "",
          password: "",
          role: "student",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.error);
    }
  };

  const handleSubmitLoginUser = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        `${import.meta.env.VITE_APP_API_URL}/users/login`,
        loginFormData
      );
      const { data } = response;
      if (data) {
        localStorage.setItem("token", data.token);
        setAuthHeader(data.token);
        setUserData(data.user);
        // A student who hasn't completed their profile goes straight there
        // on login — App.jsx's route guard would bounce them there anyway
        // on the next navigation, but this avoids a visible flash of "/"
        // before that redirect kicks in.
        if (data.user?.role === "student" && !data.user?.profileCompleted) {
          Navigate("/profile");
        } else {
          Navigate("/");
        }
        setLoginFormData({
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post(`${import.meta.env.VITE_APP_API_URL}/users/logout`);
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear local state
      localStorage.removeItem("token");
      setAuthHeader(null);
      setUserData(null);
      Navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        userData,
        setUserData,
        allUsersData,
        SetAllUsersData,
        signupFormData,
        setSignupFormData,
        loginFormData,
        setLoginFormData,
        handleSubmitRegisterUser,
        handleSubmitLoginUser,
        handleLogout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
