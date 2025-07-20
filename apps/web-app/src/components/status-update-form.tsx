import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import {
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
  upsertStatusUpdateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
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
import { Separator } from "@asyncstatus/ui/components/separator";
import { BookCheck, BookDashed } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { TeamSelect } from "./team-select";

type StatusUpdateFormProps = {
  organizationSlug: string;
  statusUpdateId: string;
  readonly?: boolean;
};

export function StatusUpdateForm({
  organizationSlug,
  statusUpdateId,
  readonly = true,
}: StatusUpdateFormProps) {
  const navigate = useNavigate();
  const [isPublishConfirmModalOpen, setIsPublishConfirmModalOpen] = useState(false);
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
  );
  const statusUpdate = useQuery(
    typedQueryOptions(getStatusUpdateContract, {
      idOrSlug: organizationSlug,
      statusUpdateIdOrDate: statusUpdateId,
    }),
  );
  const form = useForm({
    resolver: zodResolver(upsertStatusUpdateContract.inputSchema),
    defaultValues: {
      idOrSlug: organizationSlug,
      emoji: "",
      items: [],
      mood: "",
      notes: "",
      teamId: null,
      editorJson: statusUpdate.data?.editorJson ?? null,
      effectiveFrom: statusUpdate.data?.effectiveFrom ?? new Date(),
      effectiveTo: statusUpdate.data?.effectiveTo ?? new Date(),
      isDraft: statusUpdate.data?.isDraft ?? true,
    },
  });

  useEffect(() => {
    if (organizationSlug) {
      form.setValue("idOrSlug", organizationSlug);
    }
  }, [organizationSlug]);

  useEffect(() => {
    if (statusUpdate.data) {
      form.setValue("emoji", statusUpdate.data.emoji);
      form.setValue(
        "items",
        statusUpdate.data.items.map((item) => ({
          order: item.order,
          content: item.content,
          isBlocker: item.isBlocker ?? false,
          isInProgress: item.isInProgress ?? false,
        })),
      );
      form.setValue("mood", statusUpdate.data.mood);
      form.setValue("notes", statusUpdate.data.notes);
      form.setValue("teamId", statusUpdate.data.teamId);
      form.setValue("editorJson", statusUpdate.data.editorJson);
      form.setValue("effectiveFrom", statusUpdate.data.effectiveFrom);
      form.setValue("effectiveTo", statusUpdate.data.effectiveTo);
      form.setValue("isDraft", statusUpdate.data.isDraft ?? true);
    }
  }, [statusUpdate.data]);

  const effectiveFrom = form.watch("effectiveFrom");
  const queryClient = useQueryClient();
  const createStatusUpdate = useMutation(
    typedMutationOptions(upsertStatusUpdateContract, {
      onSuccess: (data) => {
        navigate({
          to: "/$organizationSlug/status-updates/$statusUpdateId",
          params: { organizationSlug, statusUpdateId: data.id },
        });
        if (!data.isDraft) {
          queryClient.invalidateQueries(
            typedQueryOptions(listStatusUpdatesByDateContract, {
              idOrSlug: organizationSlug,
              date: dayjs(data.effectiveFrom).format("YYYY-MM-DD"),
            }),
          );
        }
        queryClient.setQueryData(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }).queryKey,
          data,
        );
        queryClient.setQueryData(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: dayjs(data.effectiveFrom).format("YYYY-MM-DD"),
          }).queryKey,
          data,
        );
      },
    }),
  );

  function onSubmit(values: typeof upsertStatusUpdateContract.$infer.input, hasConfirmed: boolean) {
    if (!values.isDraft && !hasConfirmed) {
      setIsPublishConfirmModalOpen(true);
      return;
    }

    createStatusUpdate.mutate(values);
  }

  return (
    <Form {...form}>
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
                form.handleSubmit((values) => onSubmit(values, true))();
              }}
            >
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AsyncStatusEditor
        localStorageKeyPrefix={`${organization.data?.member.id}-${statusUpdateId}`}
        key={dayjs(effectiveFrom as Date)
          .startOf("day")
          .format("YYYY-MM-DD")}
        date={dayjs(effectiveFrom as Date)
          .startOf("day")
          .format("YYYY-MM-DD")}
        readonly={readonly}
        initialContent={statusUpdate.data?.editorJson ?? null}
        onDateChange={(date) => {
          const nextEffectiveFrom = dayjs(date, "YYYY-MM-DD", true).startOf("day").toDate();
          const nextEffectiveTo = dayjs(date, "YYYY-MM-DD", true).endOf("day").toDate();
          form.setValue("effectiveFrom", nextEffectiveFrom);
          form.setValue("effectiveTo", nextEffectiveTo);
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
          if (
            !statusUpdate.isPending &&
            !createStatusUpdate.isPending &&
            !organization.isPending &&
            !readonly
          ) {
            form.handleSubmit((values) => onSubmit(values, true))();
          }
        }}
      >
        {!readonly && (
          <>
            <TeamSelect
              placeholder="Select team"
              organizationSlug={organizationSlug}
              value={form.watch("teamId") ?? undefined}
              onSelect={(teamId) => {
                form.setValue("teamId", teamId ?? null);
                form.handleSubmit((values) => onSubmit(values, true))();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={createStatusUpdate.isPending}
              onClick={() => {
                form.setValue("isDraft", true);
                form.handleSubmit((values) => onSubmit(values, true))();
              }}
            >
              <BookDashed className="size-4" />
              Save as draft
            </Button>
            <Button
              size="sm"
              disabled={createStatusUpdate.isPending}
              onClick={() => {
                form.setValue("isDraft", false);
                form.handleSubmit((values) =>
                  onSubmit(values, statusUpdate.data?.isDraft ?? false),
                )();
              }}
            >
              <BookCheck className="size-4" />
              Publish
            </Button>
          </>
        )}
      </AsyncStatusEditor>
    </Form>
  );
}
