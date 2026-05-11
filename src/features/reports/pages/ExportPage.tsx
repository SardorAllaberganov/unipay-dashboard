import { ExportForm } from '../components/ExportForm';
import { RecentExportsList } from '../components/RecentExportsList';

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <ExportForm />
      <RecentExportsList />
    </div>
  );
}
