import AnswerCard from '../AnswerCard';

export default function AnswerCardExample() {
  const mockCourse = {
    subject: "NBAY",
    catalogNbr: "5500",
    titleLong: "Executive Leadership",
    gradingBasis: "Student Option",
    unitsMinimum: 3,
    unitsMaximum: 3,
    instructors: ["Jane Smith", "John Doe"],
    meetingPatterns: [
      { days: "MW", timeStart: "10:10am", timeEnd: "11:25am" }
    ],
    lastTermsOffered: "FA25, SP25, FA24"
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AnswerCard
        courseInfo={mockCourse}
        rosterSlug="FA25"
        rosterDescr="Fall 2025"
        classPageUrl="https://classes.cornell.edu/browse/roster/FA25/class/NBAY/5500"
        answerType="general"
      />
      
      <AnswerCard
        courseInfo={{
          ...mockCourse,
          gradingBasisVariations: ["Student Option (Letter or S/U)", "S/U only"]
        }}
        rosterSlug="SP24"
        rosterDescr="Spring 2024"
        isOldData={true}
        classPageUrl="https://classes.cornell.edu/browse/roster/SP24/class/NBAY/5500"
        answerType="grading"
      />
    </div>
  );
}
