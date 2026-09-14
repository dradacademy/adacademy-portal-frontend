import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/images/common/logo.png";
import { Menu as MenuIcon, X, ChevronDown } from "lucide-react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { FiLogOut } from "react-icons/fi";
import PortalSelectorPopup from "./popup/PortalSelectorPopup";

const EXAM_LINKS = [
  { name: "GATE Civil", to: "/exams/gate" },
  { name: "IES/ESE Civil", to: "/exams/ese" },
  { name: "TNPSC AE Civil", to: "/exams/tnpsc-ae" },
  { name: "TNPSC JDO Civil", to: "/exams/tnpsc-jdo" },
  { name: "SSC JE Civil", to: "/exams/ssc-je" },
  { name: "RRB JE Civil", to: "/exams/rrb-je" },
];

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Courses", href: "/#courses" },
  { name: "Achievers", href: "/#achievers" },
  { name: "Gallery", href: "/#gallery" },
  { name: "Updates", href: "/#updates" },
  { name: "Contact", href: "/#contact" },
  // A real page route, not a homepage-section anchor — rendered as a
  // react-router Link below (see isAnchorLink), unlike the entries above.
  { name: "Careers", href: "/careers" },
];

// The links above are a mix of homepage-section anchors ("/#about", which
// only make sense as a plain <a> so the browser jumps to that section) and
// real page routes like "/careers" (which should use react-router's Link
// so navigating away from the homepage actually works, including when
// you're not currently on "/").
const isAnchorLink = (href) => href.includes("#");

const Navbar = ({ dashboard }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPortalSelector, setShowPortalSelector] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [examsAnchorEl, setExamsAnchorEl] = useState(null);
  const examsOpen = Boolean(examsAnchorEl);

  const { userData, setUserData, handleLogout } = useContext(AuthContext);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full bg-white border-b border-line rounded-xl py-0.5 px-2 sm:px-6 lg:px-2 xl:px-10 shadow-sm">
      <div className="container mx-auto">
        <div className=" flex h-16 items-center justify-between">
          {/* Logo Section */}
          {!dashboard && (
            <Link to={"/"} className="flex items-center sm:gap-2 font-newsreader">
              <img className="w-fit h-fit max-w-16" src={logo} alt="" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-navy-dark hidden sm:block">
                Dr. A.D. Academy of Excellence
              </span>
              <span className="text-lg font-bold text-navy-dark sm:hidden">
                Dr. A.D. Academy
              </span>
            </Link>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-poppins font-medium text-slate">
            {userData != null ? (
              <>
                <Link
                  to={"/"}
                  className="font-medium hover:text-navy transition-colors relative group"
                >
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
                </Link>
                <Link
                  to={"/activities"}
                  className="font-medium hover:text-navy transition-colors relative group"
                >
                  Activities
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
                </Link>
                {userData?.role !== "student" && (
                  <Link
                    to={"/dashboard"}
                    className="font-medium hover:text-navy transition-colors relative group"
                  >
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
                  </Link>
                )}
              </>
            ) : (
              <>
                {NAV_LINKS.map((link) =>
                  isAnchorLink(link.href) ? (
                    <a
                      key={link.name}
                      href={link.href}
                      className="font-medium hover:text-navy transition-colors relative group"
                    >
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="font-medium hover:text-navy transition-colors relative group"
                    >
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
                    </Link>
                  )
                )}
                <div
                  onMouseEnter={(e) => setExamsAnchorEl(e.currentTarget)}
                  onMouseLeave={() => setExamsAnchorEl(null)}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={(e) => setExamsAnchorEl(e.currentTarget)}
                    className="font-medium hover:text-navy transition-colors relative group flex items-center gap-1 cursor-pointer"
                  >
                    Exams
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full"></span>
                  </button>
                  <Menu
                    anchorEl={examsAnchorEl}
                    open={examsOpen}
                    onClose={() => setExamsAnchorEl(null)}
                    MenuListProps={{ onMouseLeave: () => setExamsAnchorEl(null) }}
                    disableAutoFocusItem
                  >
                    {EXAM_LINKS.map((link) => (
                      <MenuItem
                        key={link.to}
                        component={Link}
                        to={link.to}
                        onClick={() => setExamsAnchorEl(null)}
                      >
                        {link.name}
                      </MenuItem>
                    ))}
                  </Menu>
                </div>
              </>
            )}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-4 font-poppins">
            {userData != null ? (
              <React.Fragment>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Tooltip title="">
                    <div
                      onClick={handleClick}
                      size="small"
                      sx={{ ml: 2 }}
                      aria-controls={open ? "account-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? "true" : undefined}
                      className=" bg-navy rounded-full py-1.5 px-[12px] font-medium text-slate-50 cursor-pointer"
                    >
                      <div sx={{ width: 32, height: 32, fontWeight: 500 }}>
                        {userData?.username?.slice(0, 1)?.toUpperCase()}
                      </div>
                    </div>
                  </Tooltip>
                </Box>
                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={open}
                  onClose={handleClose}
                  onClick={handleClose}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        "& .MuiAvatar-root": {
                          width: 32,
                          height: 32,
                          ml: -0.5,
                          mr: 1,
                        },
                        "&::before": {
                          content: '""',
                          display: "block",
                          position: "absolute",
                          top: 0,
                          right: 14,
                          width: 10,
                          height: 10,
                          bgcolor: "background.paper",
                          transform: "translateY(-50%) rotate(45deg)",
                          zIndex: 0,
                        },
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <div
                    className=" flex items-center gap-3 px-5 pt-0.5 pb-2 font-semibold text-stone-600 "
                    onClick={handleClose}
                  >
                    <Avatar />{" "}
                    {userData?.username?.slice(0, 1).toUpperCase() +
                      userData?.username?.slice(1)}
                  </div>
                  <Divider />
                  <div
                    className=" flex items-center px-5 pt-2 pb-1 gap-8 font-medium text-stone-600 cursor-pointer hover:bg-gray-100 rounded-md"
                    onClick={handleLogout}
                  >
                    <FiLogOut />
                    Logout
                  </div>
                </Menu>
              </React.Fragment>
            ) : (
              <button
                type="button"
                onClick={() => setShowPortalSelector(true)}
                className="px-4 py-[10px] border border-gray-200 rounded-full text-sm font-medium transition-colors hover:border-navy hover:text-navy cursor-pointer"
              >
                Log In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden text-gray-700 hover:text-navy transition-colors p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute left-4 right-4 top-20 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[75vh] overflow-y-auto">
            <div className="py-4">
              {userData != null ? (
                <>
                  <Link
                    to={"/"}
                    onClick={closeMenu}
                    className="block px-6 py-3 text-gray-600 hover:text-navy hover:bg-gray-50 transition-colors font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    to={"/activities"}
                    onClick={closeMenu}
                    className="block px-6 py-3 text-gray-600 hover:text-navy hover:bg-gray-50 transition-colors font-medium"
                  >
                    Activities
                  </Link>
                  {userData?.role !== "student" && (
                    <Link
                      to={"/dashboard"}
                      onClick={closeMenu}
                      className="block px-6 py-3 text-gray-600 hover:text-navy hover:bg-gray-50 transition-colors font-medium"
                    >
                      Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      className="block w-full text-left px-6 py-3 text-navy hover:bg-gray-50 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {NAV_LINKS.map((link) =>
                    isAnchorLink(link.href) ? (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={closeMenu}
                        className="block px-6 py-3 text-gray-600 hover:text-navy hover:bg-gray-50 transition-colors font-medium"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={closeMenu}
                        className="block px-6 py-3 text-gray-600 hover:text-navy hover:bg-gray-50 transition-colors font-medium"
                      >
                        {link.name}
                      </Link>
                    )
                  )}
                  <div className="px-6 pt-2 pb-1 text-xs font-semibold text-slate uppercase tracking-wide">
                    Exams
                  </div>
                  {EXAM_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className="block px-6 py-2.5 text-gray-600 hover:text-navy hover:bg-gray-50 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setShowPortalSelector(true);
                      }}
                      className="block w-full text-left px-6 py-3 text-navy hover:bg-gray-50 transition-colors font-medium"
                    >
                      Log In
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <PortalSelectorPopup
        open={showPortalSelector}
        onClose={() => setShowPortalSelector(false)}
      />
    </header>
  );
};

export default Navbar;
