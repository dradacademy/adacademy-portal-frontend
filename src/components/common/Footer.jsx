import { Instagram, Send, Youtube, MapPin, Phone, Mail, Clock } from "lucide-react";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/common/logo.png";
import { AuthContext } from "../../context/AuthContext";

const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://q.me-qr.com/h398jvcc", icon: Instagram },
  { name: "Telegram", href: "https://q.me-qr.com/njnd7s2z", icon: Send },
  { name: "YouTube", href: "https://www.youtube.com/@DrADAcademy", icon: Youtube },
];

const Footer = () => {
  const { userData } = useContext(AuthContext);

  return (
    <footer className="bg-navy-dark pt-16 pb-8 px-6 rounded-2xl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6 font-newsreader">
              <img className=" w-fit h-fit max-w-16" src={logo} alt="" />
              <span className="text-2xl font-bold text-white">
                Dr. A.D. Academy of Excellence
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md font-poppins">
              Concept clarity for serious civil engineering aspirants — GATE,
              IES/ESE, TNPSC AE, TNPSC JDO, and SSC JE preparation.
            </p>
            <div className="flex gap-4 mb-6">
              {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-navy-dark transition-colors">
                    <span className="sr-only">{name}</span>
                    <Icon className="w-5 h-5" />
                  </div>
                </a>
              ))}
            </div>
            <div className="space-y-3 font-inter">
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-light" />
                <span>
                  9/1, Poonthotam Nagar, Saravanampatti, Coimbatore, Tamil
                  Nadu
                </span>
              </div>
              <a
                href="tel:+919566818665"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0 text-gold-light" />
                +91 95668 18665
              </a>
              <a
                href="mailto:dradacademy@gmail.com"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0 text-gold-light" />
                dradacademy@gmail.com
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4 flex-shrink-0 text-gold-light" />
                Mon – Sun, 9:00 AM – 7:00 PM
              </div>
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
                        name: "Exams We Cover",
                        to: "#exams",
                      },
                      {
                        name: "Test Series",
                        to: "#test-series",
                      },
                      {
                        name: "About",
                        to: "#about",
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
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-inter">
            &copy; {new Date().getFullYear()} Dr. A.D. Academy of Excellence.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
