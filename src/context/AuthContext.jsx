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

  // ---- Stay-logged-in helpers -------------------------------------------
  // The login is kept in localStorage (survives the phone killing the tab
  // when the student switches apps). It is only ever cleared when the
  // SERVER says the session is no longer valid (401/403 — logout, login on
  // another device, disabled account, expired token) or on Logout. A
  // network blip / slow backend while the app is reopening no longer logs
  // the student out: we fall back to the last known user and retry.
  const USER_CACHE_KEY = "authUser";

  const cacheUser = (user) => {
    try {
      if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_CACHE_KEY);
    } catch {
      /* storage unavailable — ignore */
    }
  };

  const readCachedUser = () => {
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const clearLocalSession = () => {
    localStorage.removeItem("token");
    cacheUser(null);
    setAuthHeader(null);
    setUserData(null);
  };

  const isAuthRejection = (err) => {
    const status = err?.response?.status;
    return status === 401 || status === 403;
  };

  const fetchUser = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        clearLocalSession();
        return;
      }

      // Token past its expiry → genuinely logged out.
      let decodedToken;
      try {
        decodedToken = jwtDecode(token);
      } catch {
        clearLocalSession();
        return;
      }
      if (decodedToken.exp && decodedToken.exp < Date.now() / 1000) {
        clearLocalSession();
        Navigate("/login");
        return;
      }

      setAuthHeader(token);
      // Show the last known user immediately so the app opens straight
      // into the logged-in view while /me is still loading.
      const cached = readCachedUser();
      if (cached && !silent) setUserData(cached);

      const res = await api.get(
        `${import.meta.env.VITE_APP_API_URL}/users/me`
      );
      // Only replace userData if something actually changed, so a
      // background refresh never re-renders/re-triggers open pages (e.g. a
      // student mid-exam) for no reason.
      setUserData((prev) =>
        JSON.stringify(prev) === JSON.stringify(res.data) ? prev : res.data
      );
      cacheUser(res.data);
    } catch (err) {
      console.log("Fetch user error:", err);
      if (isAuthRejection(err)) {
        // Server rejected the session (logged out elsewhere, disabled,
        // expired) — this is a real logout.
        clearLocalSession();
      } else {
        // Network error / timeout / server waking up — keep the student
        // logged in with the last known user; retry when back online or
        // when the app comes back to the foreground.
        const cached = readCachedUser();
        if (cached) setUserData(cached);
      }
    } finally {
      if (!silent) setLoading(false);
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

    // When the student returns to the app (from another app) or the phone
    // regains internet, quietly re-confirm the session in the background —
    // no loading spinner, no redirect unless the server says logged out.
    const refreshIfLoggedIn = () => {
      if (localStorage.getItem("token")) fetchUser({ silent: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshIfLoggedIn();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", refreshIfLoggedIn);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", refreshIfLoggedIn);
    };
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
        cacheUser(data.user);
        setAuthHeader(data.token);
        setUserData(data.user);
        // A student who hasn't completed their profile goes straight there
        // on login — App.jsx's route guard would bounce them there anyway
        // on the next navigation, but this avoids a visible flash of "/"
        // before that redirect kicks in.
        if (
          data.user?.role === "student" &&
          data.user?.accountType !== "free_trial" &&
          !data.user?.profileCompleted
        ) {
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

  // Used by the public Free Test registration page: the server creates the
  // account and returns a token, so the visitor is signed in straight away.
  const loginWithToken = (token, user) => {
    localStorage.setItem("token", token);
    cacheUser(user);
    setAuthHeader(token);
    setUserData(user);
  };

  const handleLogout = async () => {
    try {
      await api.post(`${import.meta.env.VITE_APP_API_URL}/users/logout`);
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear local state
      clearLocalSession();
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
        loginWithToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
