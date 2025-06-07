import { useState } from "react";
import { generateStatusMutationOptions } from "@/rpc/organization/status-update";
import { Button } from "@asyncstatus/ui/components/button";
import { DatePickerWithPresets } from "@asyncstatus/ui/components/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { toast } from "@asyncstatus/ui/components/sonner";
import { useMutation } from "@tanstack/react-query";
import { addDays, endOfDay, startOfDay } from "date-fns";

type GenerateStatusButtonProps = {
  organizationSlug: string;
  memberId: string;
  /**
   * Optional period window. If omitted defaults to [yesterday, today].
   */
  effectiveFrom?: Date;
  effectiveTo?: Date;
  className?: string;
};

export function GenerateStatusButton({
  organizationSlug,
  memberId,
  effectiveFrom,
  effectiveTo,
  className,
}: GenerateStatusButtonProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to?: Date | undefined;
  }>({
    from: effectiveFrom ?? startOfDay(addDays(new Date(), -1)),
    to: effectiveTo ?? endOfDay(new Date()),
  });
  const mutation = useMutation({
    ...generateStatusMutationOptions(),
    onSuccess: () => {
      toast.success("Status generation job started");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to start job",
      );
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          Generate status
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate status</DialogTitle>
          <DialogDescription>
            Generate a status update for the selected period.
          </DialogDescription>
        </DialogHeader>

        <DatePickerWithPresets
          value={dateRange}
          onSelect={(date) => {
            setDateRange(date);
          }}
        />

        <Button
          type="button"
          className={className}
          variant="outline"
          onClick={() =>
            mutation.mutate({
              param: { idOrSlug: organizationSlug },
              form: {
                memberId,
                effectiveFrom:
                  dateRange.from ?? startOfDay(addDays(new Date(), -1)),
                effectiveTo: dateRange.to ?? new Date(),
              },
            })
          }
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Generating…" : "Generate Status"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
