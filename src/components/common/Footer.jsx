import { Brain } from "lucide-react";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/common/logo.png";
import { AuthContext } from "../../context/AuthContext";

const Footer = () => {
  const { userData } = useContext(AuthContext);

  return (
    <footer className="bg-gray-900 pt-16 pb-8 px-6 rounded-2xl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6 font-manrope">
              {/* <Brain className="h-8 w-8 text-blue-400" /> */}
              <img className=" w-fit h-fit max-w-16" src={logo} alt="" />
              <span className="text-2xl font-bold text-white">
                Dr. A. D. Academy of Excellence
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md font-poppins">
              A specialized platform for academy students to excel in their
              assessments through practice, feedback, and progress tracking.
            </p>
            <div className="flex gap-4">
              {["twitter", "facebook", "instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5"></div>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-6 text-lg font-poppins">
              Quick Links
            </h3>
            <ul className="space-y-4">
              {[
                ...(userData != null
                  ? [
                      {
                        name: "Home",
                        to: "/",
                      },
                      {
                        name: "Activities",
                        to: "/activities",
                      },
                      ...(userData?.role !== "student"
                        ? [
                            {
                              name: "Dashboard",
                              to: "/dashboard",
                            },
                          ]
                        : []),
                    ]
                  : [
                      {
                        name: "How It Works",
                        to: "#how-it-works",
                      },
                      {
                        name: "Subjects",
                        to: "#subjects",
                      },
                      {
                        name: "Guidelines",
                        to: "#guidelines",
                      },
                      {
                        name: "FAQ",
                        to: "#faq",
                      },
                    ]),
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group font-inter ml-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-6 text-lg font-poppins">
              Resources
            </h3>
            <ul className="space-y-4">
              {["Terms of Service", "Privacy Policy"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group font-inter ml-1"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ExamPrep Academy. All rights
            reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Privacy
            </a>
          </div>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
