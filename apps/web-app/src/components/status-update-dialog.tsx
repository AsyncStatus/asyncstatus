import { Button } from "@asyncstatus/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { StatusUpdateForm } from "./status-update-form";

type StatusUpdateDialogProps = {
  organizationSlug: string;
  onSuccess?: () => void;
};

export function StatusUpdateDialog({ organizationSlug, onSuccess }: StatusUpdateDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          New Status Update
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Status Update</DialogTitle>
          <DialogDescription>
            Share your status with your team. Add updates and mark any blockers.
          </DialogDescription>
        </DialogHeader>
        <StatusUpdateForm organizationSlug={organizationSlug} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
