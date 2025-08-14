import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";

export function StepSkeleton() {
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-bold text-center text-pretty">
          <Skeleton className="w-full h-10" />
        </AlertDialogTitle>
        <AlertDialogDescription className="text-muted-foreground font-bold text-base text-pretty text-center">
          <Skeleton className="w-3/4 h-8 mx-auto" />
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex flex-col gap-2">
        <Skeleton className="w-full h-56" />
        <Skeleton className="w-full h-12 mt-12" />
      </div>
    </>
  );
}
