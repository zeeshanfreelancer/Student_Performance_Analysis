import SubjectMarksPanel from '../../components/marks/SubjectMarksPanel';

export default function SubjectMarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Subject Marks</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter marks for students in each assigned subject. Total marks depend on subject credits.
        </p>
      </div>
      <SubjectMarksPanel />
    </div>
  );
}
