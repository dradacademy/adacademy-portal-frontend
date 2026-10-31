import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { ArrowRight } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/images/common/logo.png";

// Login — 2026-10-29 "new look": academy brand panel (navy & gold) + the
// same form as before (register number, email, password — same fields,
// same handleSubmitLoginUser, nothing about how login works changed).

const NAVY = "#0f2a4a";
const NAVY2 = "#16365e";
const GOLD = "#c9971f";
const GOLD_LIGHT = "#e8b94a";
const LINE = "#e7e1d2";

const inputCls =
  "w-full bg-white py-3 px-4 rounded-xl text-[15px] text-stone-800 placeholder:text-stone-400 focus:outline-none";

const BrandPanel = ({ compact }) => (
  <div
    className={compact ? "rounded-3xl px-6 py-7 text-white" : "rounded-3xl p-10 xl:p-14 text-white flex flex-col h-full relative overflow-hidden"}
    style={{ background: `radial-gradient(900px 500px at 15% 0%, ${NAVY2}, ${NAVY} 60%, #0a1e36)` }}
  >
    {!compact && (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    )}
    <div className="relative flex items-center gap-3">
      <img src={logo} alt="" className={`${compact ? "w-11 h-11" : "w-14 h-14"} rounded-2xl bg-white object-contain p-1`} />
      <div style={{ lineHeight: 1.1 }}>
        <div className={`font-newsreader font-semibold ${compact ? "text-xl" : "text-2xl"}`}>Dr. A.D. Academy</div>
        <div className="text-[11px] font-semibold tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.6)" }}>OF EXCELLENCE</div>
      </div>
    </div>
    <div className={`relative ${compact ? "mt-6" : "mt-auto"}`}>
      <h2 className={`font-newsreader font-semibold leading-[1.05] ${compact ? "text-3xl" : "text-5xl xl:text-6xl"}`}>
        Learn. Practise.
        <br />
        <em style={{ color: GOLD_LIGHT }}>Crack your exam.</em>
      </h2>
      <p className={`${compact ? "text-xs mt-2" : "text-base mt-4"}`} style={{ color: "rgba(255,255,255,0.75)" }}>
        GATE · ESE · TNPSC AE · TNPSC JDO · SSC JE · RRB JE — Civil Engineering
      </p>
    </div>
    <div className={`relative grid grid-cols-3 gap-3 ${compact ? "mt-5" : "mt-10 mb-auto"}`}>
      {[
        ["1000+", "students mentored"],
        ["12+", "years teaching"],
        ["6", "exams covered"],
      ].map(([a, b]) => (
        <div key={b} className="rounded-2xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div className={`font-newsreader font-semibold ${compact ? "text-xl" : "text-3xl"}`} style={{ color: GOLD_LIGHT }}>{a}</div>
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{b}</div>
        </div>
      ))}
    </div>
  </div>
);

const Login = () => {
  const { loginFormData, setLoginFormData, handleSubmitLoginUser } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-5 p-3 sm:p-6 lg:p-5 xl:p-8" style={{ backgroundColor: "#f6f3ea" }}>
      <div className="hidden lg:block">
        <BrandPanel />
      </div>
      <div className="lg:hidden">
        <BrandPanel compact />
      </div>

      <div className="flex items-center justify-center">
        <form onSubmit={handleSubmitLoginUser} className="w-full max-w-md flex flex-col gap-4 py-4 sm:py-8">
          <div>
            <h1 className="font-poppins font-bold text-3xl" style={{ color: NAVY }}>Welcome back</h1>
            <p className="text-stone-500 mt-1">Students and staff — log in to continue.</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-stone-700">Register number</span>
            <input
              type="text"
              placeholder="e.g. GATE26-041"
              name="registerNumber"
              className={inputCls}
              style={{ border: `1px solid ${LINE}` }}
              onChange={handleChange}
              value={loginFormData.registerNumber}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-stone-700">Email address</span>
            <input
              type="email"
              placeholder="you@example.com"
              name="email"
              className={inputCls}
              style={{ border: `1px solid ${LINE}` }}
              onChange={handleChange}
              value={loginFormData.email}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-stone-700">Password</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                name="password"
                className={`${inputCls} pr-12`}
                style={{ border: `1px solid ${LINE}` }}
                onChange={handleChange}
                value={loginFormData.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-stone-400 p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
              </button>
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-white cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: NAVY }}
          >
            Log in <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-stone-500">
            New here?{" "}
            <Link to="/free-test" className="font-semibold" style={{ color: NAVY }}>Take a free test</Link>
            {" · "}
            <Link to="/" className="font-semibold" style={{ color: GOLD }}>Visit our website</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
