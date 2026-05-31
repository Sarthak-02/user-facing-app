import { useState } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";

const SECTION_COLORS = {
  mcq: "border-blue-200 bg-blue-50/40",
  short: "border-green-200 bg-green-50/40",
  long: "border-purple-200 bg-purple-50/40",
  true_false: "border-amber-200 bg-amber-50/40",
  fill_blank: "border-teal-200 bg-teal-50/40",
};

const SECTION_HEADER_COLORS = {
  mcq: "text-blue-700 bg-blue-100",
  short: "text-green-700 bg-green-100",
  long: "text-purple-700 bg-purple-100",
  true_false: "text-amber-700 bg-amber-100",
  fill_blank: "text-teal-700 bg-teal-100",
};

function QuestionCard({ q, si, studentMode, selectedAnswers, revealedAnswers, onSelect, onReveal }) {
  const qKey = `${si}-${q.number}`;
  const selected = selectedAnswers[qKey];
  const isAnswered = selected !== undefined;
  const isRevealed = revealedAnswers.has(qKey);
  const correctAnswer = q.answer ?? q.verdict;
  const isMcq = !!q.options;
  const isTrueFalse = !q.options && (q.verdict !== undefined || q.type === "true_false");

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-2.5 shadow-sm">
      {/* Question text */}
      <div className="flex items-start gap-2 mb-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-xs font-bold text-gray-600 flex items-center justify-center">
          {q.number}
        </span>
        <p className="flex-1 text-sm text-gray-900 font-medium leading-snug">
          {q.question ?? q.statement ?? q.sentence}
        </p>
      </div>

      {/* MCQ options */}
      {isMcq && (
        <div className="ml-7 space-y-1 mb-1.5">
          {Object.entries(q.options).map(([opt, text]) => {
            const isSelected = selected === opt;
            const isCorrect = opt === correctAnswer;

            let cls = "bg-gray-50 text-gray-700";
            if (!studentMode) {
              if (isCorrect) cls = "bg-green-50 border border-green-200 text-green-800 font-semibold";
            } else if (isAnswered) {
              if (isCorrect) cls = "bg-green-50 border border-green-200 text-green-800 font-semibold";
              else if (isSelected) cls = "bg-red-50 border border-red-200 text-red-800";
              else cls = "bg-gray-50 text-gray-400";
            } else {
              cls = "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:border-blue-200 cursor-pointer";
            }

            return (
              <div
                key={opt}
                role={studentMode && !isAnswered ? "button" : undefined}
                onClick={studentMode && !isAnswered ? () => onSelect(qKey, opt) : undefined}
                className={`flex items-start gap-1.5 rounded-lg border border-transparent px-2 py-1.5 text-xs transition-colors select-none ${cls}`}
              >
                <span className="font-bold flex-shrink-0">{opt}.</span>
                <span>{text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* MCQ result feedback */}
      {isMcq && studentMode && isAnswered && (
        <p className={`ml-7 text-xs font-medium mb-1 ${selected === correctAnswer ? "text-green-600" : "text-red-600"}`}>
          {selected === correctAnswer ? "Correct!" : `Incorrect — correct answer is ${correctAnswer}`}
        </p>
      )}

      {/* True / False buttons */}
      {isTrueFalse && studentMode && !isAnswered && (
        <div className="ml-7 flex gap-2 mb-1.5">
          {["True", "False"].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => onSelect(qKey, val)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {val}
            </button>
          ))}
        </div>
      )}

      {/* True/False result */}
      {isTrueFalse && studentMode && isAnswered && (
        <div
          className={`ml-7 rounded-lg px-2.5 py-1.5 text-xs mb-1.5 ${
            selected === correctAnswer
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {selected === correctAnswer
            ? "Correct!"
            : `Incorrect — answer is ${correctAnswer}`}
        </div>
      )}

      {/* Staff: True/False and short/long answers always visible */}
      {!studentMode && !isMcq && correctAnswer && (
        <div className="ml-7 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs text-green-800 mb-1.5">
          <span className="font-semibold">Answer: </span>{correctAnswer}
        </div>
      )}

      {/* Student: short/long/fill_blank — reveal button or revealed answer */}
      {studentMode && !isMcq && !isTrueFalse && correctAnswer && (
        isRevealed ? (
          <div className="ml-7 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs text-green-800 mb-1.5">
            <span className="font-semibold">Answer: </span>{correctAnswer}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onReveal(qKey)}
            className="ml-7 mb-1.5 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Eye className="h-3 w-3" />
            Show Answer
          </button>
        )
      )}

      {/* Explanation — always in staff mode; in student mode only after attempting */}
      {(q.explanation ?? q.justification) && (!studentMode || isAnswered || isRevealed) && (
        <p className="ml-7 text-xs text-gray-400 italic mt-1">{q.explanation ?? q.justification}</p>
      )}

      <div className="ml-7 mt-1.5">
        <span className="text-xs text-gray-400">{q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
      </div>
    </div>
  );
}

export default function ContentViewer({ content, studentMode = false }) {
  const [openSections, setOpenSections] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());

  if (!content) return null;

  if (content.text) {
    return (
      <div className="mt-2 rounded-lg bg-white border border-gray-100 px-3 py-2.5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {content.text}
      </div>
    );
  }

  if (!Array.isArray(content.sections) || content.sections.length === 0) return null;

  const toggle = (i) => setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }));

  const handleSelect = (qKey, answer) =>
    setSelectedAnswers((prev) => ({ ...prev, [qKey]: answer }));

  const handleReveal = (qKey) =>
    setRevealedAnswers((prev) => new Set([...prev, qKey]));

  return (
    <div className="mt-2 space-y-2">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-indigo-50 px-3 py-2">
        <span className="text-xs font-semibold text-indigo-700">{content.total_questions} questions</span>
        <span className="text-indigo-300 text-xs">·</span>
        <span className="text-xs font-semibold text-indigo-700">{content.total_marks} marks</span>
        {content.time_minutes != null && (
          <>
            <span className="text-indigo-300 text-xs">·</span>
            <span className="text-xs font-semibold text-indigo-700">{content.time_minutes} min</span>
          </>
        )}
        {content.difficulty && (
          <>
            <span className="text-indigo-300 text-xs">·</span>
            <span className="text-xs font-semibold text-indigo-700 capitalize">{content.difficulty}</span>
          </>
        )}
      </div>

      {/* Sections */}
      {content.sections.map((section, si) => {
        const colorClass = SECTION_COLORS[section.type] ?? "border-gray-200 bg-gray-50/40";
        const headerColor = SECTION_HEADER_COLORS[section.type] ?? "text-gray-700 bg-gray-100";
        const isOpen = openSections[si] !== false;
        return (
          <div key={si} className={`rounded-xl border ${colorClass} overflow-hidden`}>
            <button
              type="button"
              onClick={() => toggle(si)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${headerColor}`}>
                  {section.label}
                </span>
                <span className="text-xs text-gray-500">
                  {section.questions.length} q · {section.section_marks} marks
                </span>
              </div>
              {isOpen
                ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            {isOpen && (
              <div className="border-t border-white/60 px-3 pb-3 pt-2 space-y-2">
                {section.questions.map((q) => (
                  <QuestionCard
                    key={q.number}
                    q={q}
                    si={si}
                    studentMode={studentMode}
                    selectedAnswers={selectedAnswers}
                    revealedAnswers={revealedAnswers}
                    onSelect={handleSelect}
                    onReveal={handleReveal}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
