import bank from "../../../../../ingestion-artifacts/python-conditional-statements-question-bank.json";
import { PythonExamPractice, type PracticeQuestion } from "@/components/python-exam-practice";
import { EXTRA_PROGRAMS } from "@/lib/python/extra-programs";

export default function PythonPracticePage() {
  return <PythonExamPractice questions={[...bank.questions, ...EXTRA_PROGRAMS] as PracticeQuestion[]} />;
}
