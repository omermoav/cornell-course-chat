import StatusMessage from '../StatusMessage';

export default function StatusMessageExample() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <StatusMessage type="loading" />
      <StatusMessage type="error" />
      <StatusMessage type="notFound" courseCode="NBAY 5500" />
      <StatusMessage 
        type="passRatePolicy" 
        classPageUrl="https://classes.cornell.edu/browse/roster/FA25/class/ORIE/3500"
      />
      <StatusMessage type="empty" />
    </div>
  );
}
