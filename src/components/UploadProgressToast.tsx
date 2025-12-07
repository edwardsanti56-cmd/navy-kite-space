import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressToastProps {
  progress: number;
  fileName: string;
  onCancel?: () => void;
}

export function UploadProgressToast({ progress, fileName, onCancel }: UploadProgressToastProps) {
  const isComplete = progress >= 100;
  
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
          {isComplete ? "Processing..." : `Uploading ${fileName}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          {!isComplete && onCancel && (
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
