import { createStatusUpdateMutationOptions } from "@/rpc/organization/status-update";
import { zStatusUpdateCreate } from "@asyncstatus/api/schema/statusUpdate";
import { AsyncStatusEditor } from "@asyncstatus/editor";
import { Button } from "@asyncstatus/ui/components/button";
import { Form } from "@asyncstatus/ui/components/form";
import { BookCheck, BookDashed } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { z } from "zod";

type StatusUpdateFormProps = {
  organizationSlug: string;
};

export function StatusUpdateForm({ organizationSlug }: StatusUpdateFormProps) {
  const form = useForm<z.infer<typeof zStatusUpdateCreate>>({
    resolver: zodResolver(zStatusUpdateCreate),
    defaultValues: {
      emoji: "",
      items: [],
      mood: "",
      notes: "",
      teamId: "",
      effectiveFrom: new Date(),
      effectiveTo: new Date(),
      isDraft: true,
    },
  });

  const { mutate: createStatusUpdate, isPending } = useMutation(
    createStatusUpdateMutationOptions(),
  );

  function onSubmit(values: z.infer<typeof zStatusUpdateCreate>) {
    createStatusUpdate({
      param: { idOrSlug: organizationSlug },
      json: values,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <AsyncStatusEditor
          onUpdate={(data) => {
            form.setValue("emoji", data.moodEmoji);
            form.setValue("mood", data.mood);
            form.setValue("notes", data.notes);
            form.setValue("items", data.statusUpdateItems);
            form.setValue("isDraft", false);
            form.setValue(
              "effectiveFrom",
              dayjs(data.date).startOf("day").toDate(),
            );
            form.setValue(
              "effectiveTo",
              dayjs(data.date).endOf("day").toDate(),
            );
          }}
        >
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                form.setValue("isDraft", true);
              }}
            >
              <BookDashed className="size-4" />
              Save as draft
            </Button>
            <Button size="sm" type="submit" disabled={isPending}>
              <BookCheck className="size-4" />
              Publish
            </Button>
          </div>
        </AsyncStatusEditor>
      </form>
    </Form>
  );
}
