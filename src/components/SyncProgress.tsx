import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useSyncStatus';

interface SyncProgressProps {
  userId: string | undefined;
}

export function SyncProgress({ userId }: SyncProgressProps) {
  const { isComplete, monthsDone, totalMonths, isLoading } = useSyncStatus(userId);

  if (isLoading) {
    return null;
  }

  if (isComplete) {
    return null;
  }

  const progress = (monthsDone / totalMonths) * 100;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="font-medium text-sm">
          Synchronisiere deine Runs der letzten 12 Monate...
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">
        {monthsDone} von {totalMonths} Monaten synchronisiert
      </p>
    </div>
  );
}

export function SyncCompleteToast() {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="h-5 w-5 text-green-500" />
      <span>Alle Runs erfolgreich synchronisiert!</span>
    </div>
  );
}
