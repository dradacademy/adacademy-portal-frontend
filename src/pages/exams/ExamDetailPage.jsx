import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  GraduationCap,
  ClipboardList,
  Percent,
  ListChecks,
  CalendarDays,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

// Real exam details, researched from official/authoritative sources
// (UPSC, TNPSC, SSC, RRB, GATE-organizing-institute notifications and
// well-established exam-prep references) as of September 2026. Exam
// rules, fees, vacancy counts and dates change with each new official
// notification — the disclaimer banner on every page tells students to
// verify against the latest one before applying. Update the relevant
// exam's object here whenever a new notification changes something.
const EXAMS = {
  gate: {
    name: "GATE Civil",
    fullName: "Graduate Aptitude Test in Engineering — Civil Engineering",
    tier: "National Elite Services",
    conductedBy: "IIT Madras (organizing institute for GATE 2027; rotates among IITs/IISc each year)",
    description:
      "Comprehensive conceptual depth, MSQ & NAT mastery, PYQ analysis — the gateway to M.Tech admissions and PSU recruitment.",
    hasPortal: true,
    eligibility: [
      "B.E./B.Tech. (Civil Engineering) or equivalent, including candidates currently in their 3rd year or higher.",
      "Also open to B.Arch., B.Sc. (4-year), M.Sc., and other qualifying degrees listed in the official GATE brochure.",
      "No upper age limit.",
    ],
    pattern: {
      questions: "65 questions",
      marks: "100 marks",
      duration: "3 hours",
      breakdown:
        "General Aptitude 15 marks, Engineering Mathematics 13 marks, Core Civil Engineering 72 marks",
      types: "MCQs, MSQs (Multiple Select), and NAT (Numerical Answer Type)",
    },
    marking: [
      "1-mark MCQ: +1 for correct, −1/3 for wrong.",
      "2-mark MCQ: +2 for correct, −2/3 for wrong.",
      "MSQ and NAT questions: no negative marking.",
      "Unattempted questions: no marks deducted.",
    ],
    selection: [
      "GATE does not have an interview stage — the score itself is the outcome.",
      "Used for admission to M.Tech/M.E./direct Ph.D. programs at IITs, NITs, IISc, and other institutes across India.",
      "Used directly by many PSUs (public-sector undertakings) for engineer recruitment, without a separate written exam.",
      "GATE score is valid for 3 years from the result date.",
    ],
    dates: [
      { label: "Registration opens", date: "2 September 2026" },
      { label: "Regular registration closes", date: "27 September 2026" },
      { label: "Extended registration closes", date: "5 October 2026" },
      { label: "Exam dates", date: "6, 7, 13, 14, 20, 21 February 2027" },
      { label: "Result declaration", date: "19 March 2027" },
    ],
  },
  ese: {
    name: "IES/ESE Civil",
    fullName: "Engineering Services Examination — Civil Engineering",
    tier: "National Elite Services",
    conductedBy: "Union Public Service Commission (UPSC)",
    description:
      "A three-stage national exam for Class I/II engineering officer posts in the Government of India — among the most prestigious civil engineering careers in the country.",
    hasPortal: false,
    eligibility: [
      "Engineering degree (Civil Engineering) from a recognized university/institution, or an equivalent qualification.",
      "Age: 21 to 30 years as of 1 January of the exam year (upper limit 30).",
      "Age relaxation: +5 years for SC/ST, +3 years for OBC, up to +10 years for certain PwBD candidates.",
      "No fixed cap on number of attempts, provided the candidate is within the age limit.",
    ],
    pattern: {
      stages: [
        {
          name: "Preliminary Exam (Stage I) — objective, screening only",
          rows: [
            { label: "Paper I — General Studies & Engineering Aptitude", value: "200 marks, 2 hours" },
            { label: "Paper II — Civil Engineering", value: "300 marks, 3 hours" },
          ],
        },
        {
          name: "Main Exam (Stage II) — conventional/subjective",
          rows: [
            { label: "Civil Engineering Paper I", value: "300 marks, 3 hours" },
            { label: "Civil Engineering Paper II", value: "300 marks, 3 hours" },
          ],
        },
        {
          name: "Personality Test (Stage III)",
          rows: [{ label: "Interview", value: "200 marks" }],
        },
      ],
      total: "1,200 marks overall (500 Prelims + 600 Mains + 200 Interview)",
    },
    marking: [
      "Objective papers (Prelims) carry the standard UPSC negative marking of 1/3 mark per wrong answer.",
      "Prelims marks are used only to screen candidates into the Mains — they don't count toward the final merit list.",
      "Final rank is decided by Mains + Interview marks (800 out of the 1,200 total) only.",
    ],
    selection: [
      "Clear the Prelims (screening/qualifying stage).",
      "Clear the Mains written papers.",
      "Attend the Personality Test (interview) — mandatory for shortlisted candidates.",
      "Final merit is based on combined Mains + Interview marks, subject to document verification and medical fitness.",
    ],
    dates: [
      { label: "Notification", date: "16 September 2026" },
      { label: "Application deadline", date: "6 October 2026" },
      { label: "Preliminary Exam", date: "31 January 2027" },
      { label: "Main Exam", date: "18 June 2027" },
    ],
  },
  "tnpsc-ae": {
    name: "TNPSC AE Civil",
    fullName: "Combined Engineering Services Examination (CESE) — Assistant Engineer, Civil",
    tier: "State Engineering Services",
    conductedBy: "Tamil Nadu Public Service Commission (TNPSC)",
    description:
      "High-speed objective accuracy, IS Code provisions, state syllabus coverage — the direct route into Tamil Nadu government Assistant Engineer posts.",
    hasPortal: true,
    eligibility: [
      "B.E. in Civil Engineering, or Civil & Structural Engineering, or equivalent (a pass in Sections A & B of the Institution Examinations under the Civil Engineering branch also qualifies).",
      "Age limit: 32 years (general/\"Others\" category) as of the cut-off date in the notification.",
      "No upper age limit for SC/ST/MBC/DC/BC(OBCM)/BCM/Destitute Widow candidates; up to 50 years for ex-servicemen; up to +10 years relaxation for candidates with benchmark disabilities.",
    ],
    pattern: {
      stages: [
        {
          name: "Paper I — Civil Engineering (degree standard)",
          rows: [
            { label: "Type", value: "Objective (OMR), bilingual (English & Tamil)" },
            { label: "Questions / Marks", value: "200 questions, 300 marks" },
            { label: "Duration", value: "3 hours" },
          ],
        },
        {
          name: "Paper II — Compulsory (all posts)",
          rows: [
            { label: "Part A — Tamil Eligibility Test (SSLC standard)", value: "100 questions, 150 marks (qualifying only — min. 60/150; not counted in the final rank)" },
            { label: "Part B — General Studies + Aptitude", value: "100 questions, 150 marks (75 General Studies + 25 Aptitude/Mental Ability)" },
          ],
        },
        {
          name: "Oral Test / Interview",
          rows: [{ label: "Marks", value: "60 marks — mandatory for shortlisted candidates" }],
        },
      ],
    },
    marking: [
      "No negative marking on either paper.",
      "Minimum qualifying marks — general category: 204/300 in Paper I, 180/300 in Paper II (Part A + Part B combined).",
      "Minimum qualifying marks — SC/ST/MBC/DC/BC(OBCM)/BCM: 153/300 in Paper I, 135/300 in Paper II.",
    ],
    selection: [
      "Appear for both papers of the written exam (missing any paper disqualifies the candidate, even if other scores clear the cutoff).",
      "Candidates meeting the qualifying marks are called for the Oral Test/Interview.",
      "Final selection is based on combined written exam + interview marks, subject to reservation rules and certificate verification.",
    ],
    dates: [
      { label: "Batch status", date: "TNPSC AE Civil batch — details and enrollment dates will be shared soon; call/WhatsApp for the latest." },
    ],
  },
  "tnpsc-jdo": {
    name: "TNPSC JDO Civil",
    fullName: "Combined Engineering Subordinate Services Examination (CESSE) — Junior Draughting Officer, Civil",
    tier: "State Engineering Services",
    conductedBy: "Tamil Nadu Public Service Commission (TNPSC)",
    description:
      "High-speed objective accuracy, IS Code provisions, state syllabus coverage — a diploma-level route into Tamil Nadu government engineering posts.",
    hasPortal: true,
    eligibility: [
      "Diploma in Civil Engineering (or equivalent) from a University/Institution recognized by the State Board of Technical Education and Training.",
      "Preference given, other things being equal, to candidates who have completed one year of apprenticeship training under a Government of India or State Government scheme.",
      "Age limit: 32 years (general category); up to 35 years for SC/SC(A)/ST; up to 34 years for MBC/DC/BC/BCM candidates.",
    ],
    pattern: {
      stages: [
        {
          name: "Part 1 — Subject Paper",
          rows: [
            { label: "Subject", value: "Civil Engineering (degree/diploma standard)" },
            { label: "Marks", value: "300 marks" },
          ],
        },
        {
          name: "Part 2 — General Studies + Aptitude",
          rows: [{ label: "Marks", value: "200 marks" }],
        },
      ],
      total: "500 marks total, OMR-based objective exam",
    },
    marking: [
      "No negative marking.",
      "No interview stage for this post — unlike Assistant Engineer (AE), selection is by written exam alone, followed by document verification.",
    ],
    selection: [
      "OMR-based written exam (Part 1 + Part 2).",
      "Certificate/document verification for candidates who clear the written exam.",
      "No oral test/interview stage.",
    ],
    dates: [
      { label: "Batch status", date: "TNPSC JDO Civil batch — details and enrollment dates will be shared soon; call/WhatsApp for the latest." },
    ],
  },
  "ssc-je": {
    name: "SSC JE Civil",
    fullName: "Junior Engineer Examination — Civil",
    tier: "Central Technical Services",
    conductedBy: "Staff Selection Commission (SSC)",
    description:
      "CBT pattern drills, technical + general studies integration — for Junior Engineer posts across central government departments (CPWD, MES, BRO, DGQA, and others).",
    hasPortal: true,
    eligibility: [
      "Degree or 3-year diploma in Civil Engineering from a recognized institution.",
      "Some departments (e.g. Border Roads Organisation) additionally require relevant post-qualification work experience — check the specific department's requirement in the official notification.",
      "Age limit: typically up to 30 years (up to 32 years for CPWD and the Directorate General of Lighthouses & Lightships), with standard SC/ST/OBC/PwBD relaxations.",
    ],
    pattern: {
      stages: [
        {
          name: "Paper I — Computer-Based Test (CBT)",
          rows: [
            { label: "Duration", value: "2 hours" },
            { label: "Questions / Marks", value: "200 questions, 200 marks" },
            {
              label: "Composition",
              value:
                "General Intelligence & Reasoning (50), General Awareness (50), General Engineering — Civil & Structural (100)",
            },
          ],
        },
        {
          name: "Paper II — Computer-Based Test (CBT)",
          rows: [
            { label: "Duration", value: "2 hours" },
            { label: "Questions / Marks", value: "100 questions, 300 marks" },
            { label: "Composition", value: "Discipline-specific Civil Engineering questions" },
          ],
        },
      ],
    },
    marking: [
      "Paper I: 0.25 marks deducted per wrong answer.",
      "Paper II: 1 mark deducted per wrong answer.",
      "(Always confirm the exact marking scheme against the current year's official notification, since SSC has revised it between cycles in the past.)",
    ],
    selection: [
      "Paper I (screening stage).",
      "Paper II (the main technical paper — decisive for merit).",
      "Document verification.",
      "Medical examination.",
    ],
    dates: [
      { label: "Latest notification released", date: "2 September 2026" },
      { label: "Application window", date: "2 – 22 September 2026" },
      { label: "Exam dates", date: "To be announced by SSC" },
    ],
  },
  "rrb-je": {
    name: "RRB JE Civil",
    fullName: "Junior Engineer Examination — Civil",
    tier: "Central Technical Services",
    conductedBy: "Railway Recruitment Boards (RRB), Indian Railways",
    description:
      "CBT pattern drills, technical + general studies integration — for Junior Engineer posts across Indian Railways zones.",
    hasPortal: true,
    eligibility: [
      "Diploma or degree in Civil Engineering from a recognized institution.",
      "Age: 18 to 33 years as of the notification's cut-off date (varies slightly by notification cycle).",
      "Age relaxation: +5 years for SC/ST, +3 years for OBC-NCL, plus standard relaxations for Ex-servicemen and PwBD candidates.",
    ],
    pattern: {
      stages: [
        {
          name: "CBT 1 — screening stage (not counted in final merit)",
          rows: [
            { label: "Duration", value: "90 minutes" },
            { label: "Questions / Marks", value: "100 questions, 100 marks" },
            {
              label: "Composition",
              value: "Mathematics (30), General Intelligence & Reasoning (25), General Awareness (15), General Science (30)",
            },
          ],
        },
        {
          name: "CBT 2 — merit-determining stage",
          rows: [
            { label: "Duration", value: "120 minutes" },
            { label: "Questions / Marks", value: "150 questions, 150 marks" },
            {
              label: "Composition",
              value:
                "General Awareness (15), Physics & Chemistry (15), Basics of Computers & Applications (10), Environment & Pollution Control (10), Technical Abilities — Civil (100)",
            },
          ],
        },
      ],
    },
    marking: [
      "1/3 mark deducted per wrong answer, in both CBT 1 and CBT 2.",
      "Minimum qualifying marks range from 25% (ST category) to 40% (General/UR category), varying by category.",
      "CBT 1 is a screening round only — the final merit list is based on CBT 2 performance.",
    ],
    selection: [
      "CBT 1 (screening, normalized scoring across shifts).",
      "CBT 2 (the paper that decides final merit).",
      "Document verification.",
      "Medical examination.",
    ],
    dates: [
      {
        label: "Next notification",
        date: "RRB JE is recruited in periodic cycles rather than every year — the next notification's dates will be announced by the Railway Recruitment Boards; call/WhatsApp for the latest update.",
      },
    ],
  },
};

const StageTable = ({ stages, total }) => (
  <div className="flex flex-col gap-5">
    {stages.map((stage) => (
      <div key={stage.name}>
        <h3 className="text-sm font-semibold text-navy-dark font-inter mb-2">
          {stage.name}
        </h3>
        <div className="border border-line rounded-lg overflow-hidden">
          {stage.rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-2.5 text-sm font-inter ${
                i % 2 === 0 ? "bg-cream" : "bg-white"
              }`}
            >
              <span className="text-slate sm:w-64 flex-shrink-0">
                {row.label}
              </span>
              <span className="text-ink font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
    {total && (
      <p className="text-sm text-ink font-inter">
        <strong className="font-semibold">Total:</strong> {total}
      </p>
    )}
  </div>
);

const SimplePattern = ({ pattern }) => (
  <div className="bg-cream rounded-xl border border-line p-6">
    <div className="grid sm:grid-cols-3 gap-4 text-center mb-4">
      <div>
        <div className="font-newsreader text-2xl font-semibold text-navy-dark">
          {pattern.questions}
        </div>
      </div>
      <div>
        <div className="font-newsreader text-2xl font-semibold text-navy-dark">
          {pattern.marks}
        </div>
      </div>
      <div>
        <div className="font-newsreader text-2xl font-semibold text-navy-dark">
          {pattern.duration}
        </div>
      </div>
    </div>
    <p className="text-sm text-ink font-inter">
      <strong className="font-semibold">Marks breakdown:</strong>{" "}
      {pattern.breakdown}
    </p>
    <p className="text-sm text-ink font-inter mt-1.5">
      <strong className="font-semibold">Question types:</strong>{" "}
      {pattern.types}
    </p>
  </div>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="mt-9">
    <div className="flex items-center gap-2.5 mb-3.5">
      <Icon className="w-[18px] h-[18px] text-gold flex-shrink-0" />
      <h2 className="text-sm font-semibold tracking-wide uppercase text-navy-dark font-inter">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const ExamDetailPage = () => {
  const { examSlug } = useParams();
  const exam = EXAMS[examSlug];

  return (
    <div className="p-5">
      <Navbar />
      <div className="mt-5 max-w-3xl mx-auto py-16">
        {!exam ? (
          <div className="text-center">
            <h1 className="font-newsreader text-3xl text-navy-dark">
              Exam not found
            </h1>
            <Link
              to="/#courses"
              className="inline-flex items-center gap-1.5 text-navy mt-5 hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
          </div>
        ) : (
          <div>
            <Link
              to="/#courses"
              className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-navy transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
            <span className="block text-gold text-xs font-semibold tracking-wide uppercase font-inter mt-6">
              {exam.tier}
            </span>
            <h1 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-2">
              {exam.name}
            </h1>
            <p className="text-sm text-slate font-inter mt-1.5">
              {exam.fullName} · Conducted by {exam.conductedBy}
            </p>
            <p className="text-[15px] text-slate leading-relaxed mt-4 font-inter">
              {exam.description}
            </p>

            <div className="bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 mt-6">
              <p className="text-xs text-ink font-inter leading-relaxed">
                Details below are compiled from official notifications and
                authoritative exam-prep sources as of September 2026. Exam
                rules, fees, vacancies, and dates change with every new
                official notification — always cross-check against the
                latest one before applying.
              </p>
            </div>

            {exam.eligibility && (
              <Section icon={GraduationCap} title="Eligibility">
                <ul className="flex flex-col gap-2">
                  {exam.eligibility.map((item, i) => (
                    <li
                      key={i}
                      className="text-[15px] text-ink leading-relaxed font-inter flex gap-2.5"
                    >
                      <span className="text-gold flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {exam.pattern && (
              <Section icon={ClipboardList} title="Exam Pattern">
                {exam.pattern.stages ? (
                  <StageTable stages={exam.pattern.stages} total={exam.pattern.total} />
                ) : (
                  <SimplePattern pattern={exam.pattern} />
                )}
              </Section>
            )}

            {exam.marking && (
              <Section icon={Percent} title="Marking Scheme">
                <ul className="flex flex-col gap-2">
                  {exam.marking.map((item, i) => (
                    <li
                      key={i}
                      className="text-[15px] text-ink leading-relaxed font-inter flex gap-2.5"
                    >
                      <span className="text-gold flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {exam.selection && (
              <Section icon={ListChecks} title="Selection Process">
                <ol className="flex flex-col gap-2">
                  {exam.selection.map((item, i) => (
                    <li
                      key={i}
                      className="text-[15px] text-ink leading-relaxed font-inter flex gap-2.5"
                    >
                      <span className="text-gold font-semibold flex-shrink-0">
                        {i + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {exam.dates && (
              <Section icon={CalendarDays} title="Important Dates">
                <div className="border border-line rounded-lg overflow-hidden">
                  {exam.dates.map((d, i) => (
                    <div
                      key={d.label}
                      className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-2.5 text-sm font-inter ${
                        i % 2 === 0 ? "bg-cream" : "bg-white"
                      }`}
                    >
                      <span className="text-slate sm:w-52 flex-shrink-0 font-medium">
                        {d.label}
                      </span>
                      <span className="text-ink">{d.date}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div className="bg-white rounded-xl border border-line p-7 mt-9">
              <p className="text-[15px] text-ink leading-relaxed font-inter">
                Have questions about our {exam.name} coaching — batch
                timings, fees, or study materials? Call or WhatsApp us at{" "}
                <strong className="font-semibold">+91 95668 18665</strong>.
              </p>
              {!exam.hasPortal && (
                <p className="text-sm text-slate mt-4 font-inter">
                  Online test portal coming soon for this exam — contact us
                  to enroll in the meantime.
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-6">
                <a
                  href="tel:+919566818665"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-navy text-white rounded-full text-sm font-medium hover:bg-navy-dark transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Us
                </a>
                <a
                  href="https://wa.me/919566818665"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-5">
        <Footer />
      </div>
    </div>
  );
};

export default ExamDetailPage;
