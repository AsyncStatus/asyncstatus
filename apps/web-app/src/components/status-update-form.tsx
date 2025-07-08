import { zStatusUpdateCreate } from "@asyncstatus/api/schema/statusUpdate";
import { AsyncStatusEditor } from "@asyncstatus/editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Button } from "@asyncstatus/ui/components/button";
import { Form } from "@asyncstatus/ui/components/form";
import { BookCheck, BookDashed } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod/v4";
import { createStatusUpdateMutationOptions } from "@/rpc/organization/status-update";

type StatusUpdateFormProps = {
  initialDate?: string;
  initialEditorJson?: any;
  initialIsDraft?: boolean;
  organizationSlug: string;
};

export function StatusUpdateForm({
  initialDate,
  initialEditorJson,
  initialIsDraft,
  organizationSlug,
}: StatusUpdateFormProps) {
  const navigate = useNavigate();
  const [isPublishConfirmModalOpen, setIsPublishConfirmModalOpen] = useState(false);
  const [isPublishConfirm, setIsPublishConfirm] = useState(false);
  const form = useForm({
    resolver: zodResolver(zStatusUpdateCreate),
    defaultValues: {
      emoji: "",
      items: [],
      mood: "",
      notes: "",
      teamId: "",
      editorJson: initialEditorJson ?? null,
      effectiveFrom: initialDate
        ? dayjs(initialDate, "YYYY-MM-DD", true).startOf("day").toDate()
        : new Date(),
      effectiveTo: initialDate
        ? dayjs(initialDate, "YYYY-MM-DD", true).endOf("day").toDate()
        : new Date(),
      isDraft: initialIsDraft ?? true,
    },
  });

  useEffect(() => {
    if (initialDate) {
      form.setValue(
        "effectiveFrom",
        dayjs(initialDate, "YYYY-MM-DD", true).startOf("day").toDate(),
      );
      form.setValue("effectiveTo", dayjs(initialDate, "YYYY-MM-DD", true).endOf("day").toDate());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate]);

  useEffect(() => {
    if (initialEditorJson) {
      form.setValue("editorJson", initialEditorJson);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditorJson]);

  useEffect(() => {
    if (initialIsDraft) {
      form.setValue("isDraft", initialIsDraft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIsDraft]);

  const effectiveFrom = form.watch("effectiveFrom");

  const queryClient = useQueryClient();
  const { mutate: createStatusUpdate, isPending } = useMutation(
    createStatusUpdateMutationOptions(queryClient),
  );

  function onSubmit(values: z.infer<typeof zStatusUpdateCreate>) {
    if (!values.isDraft && !isPublishConfirm) {
      setIsPublishConfirmModalOpen(true);
      return;
    }

    createStatusUpdate({
      param: { idOrSlug: organizationSlug },
      json: values,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <AlertDialog open={isPublishConfirmModalOpen} onOpenChange={setIsPublishConfirmModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will publish the status update to the organization.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsPublishConfirmModalOpen(false);
                  setIsPublishConfirm(true);
                  form.handleSubmit(onSubmit)();
                }}
              >
                Publish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AsyncStatusEditor
          key={dayjs(effectiveFrom as Date)
            .startOf("day")
            .format("YYYY-MM-DD")}
          date={dayjs(effectiveFrom as Date)
            .startOf("day")
            .format("YYYY-MM-DD")}
          initialContent={initialEditorJson}
          onDateChange={(date) => {
            const nextEffectiveFrom = dayjs(date, "YYYY-MM-DD", true).startOf("day").toDate();
            const nextEffectiveTo = dayjs(date, "YYYY-MM-DD", true).endOf("day").toDate();

            form.setValue("effectiveFrom", nextEffectiveFrom);
            form.setValue("effectiveTo", nextEffectiveTo);

            if (effectiveFrom !== nextEffectiveFrom) {
              navigate({
                to: "/$organizationSlug/status-update/$statusUpdateId",
                params: {
                  organizationSlug,
                  statusUpdateId: dayjs(nextEffectiveFrom).format("YYYY-MM-DD"),
                },
              });
            }
          }}
          onUpdate={(data) => {
            form.setValue("emoji", data.moodEmoji);
            form.setValue("mood", data.mood);
            form.setValue("notes", data.notes);
            form.setValue("items", data.statusUpdateItems);
            form.setValue("editorJson", data.editorJson);

            const nextEffectiveFrom = dayjs(data.date).startOf("day").toDate();
            form.setValue("effectiveFrom", nextEffectiveFrom);
            form.setValue("effectiveTo", dayjs(data.date).endOf("day").toDate());

            if (form.getValues("isDraft") && !isPending) {
              form.handleSubmit(onSubmit)();
            }
          }}
        >
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              type="submit"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                form.setValue("isDraft", true);
              }}
            >
              <BookDashed className="size-4" />
              Save as draft
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={isPending}
              onClick={() => {
                form.setValue("isDraft", false);
              }}
            >
              <BookCheck className="size-4" />
              Publish
            </Button>
          </div>
        </AsyncStatusEditor>
      </form>
    </Form>
  );
}
