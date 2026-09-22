import bank from "../../../../../ingestion-artifacts/python-conditional-statements-question-bank.json";
import { PythonExamPractice, type PracticeQuestion } from "@/components/python-exam-practice";

export default function PythonPracticePage() {
  return <PythonExamPractice questions={bank.questions as PracticeQuestion[]} />;
}
