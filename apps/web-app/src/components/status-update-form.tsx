import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import {
  generateStatusUpdateContract,
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
  updateStatusUpdateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { AsyncStatusEditor, type AsyncStatusEditorOnUpdateArgs } from "@asyncstatus/editor";
import { Button } from "@asyncstatus/ui/components/button";
import { Form } from "@asyncstatus/ui/components/form";
import { BookCheck, BookDashed, Sparkles } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deepEqual, useNavigate } from "@tanstack/react-router";
import { generateId } from "better-auth";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useDebouncedCallback from "@/lib/use-debounced-callback";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { TeamSelect } from "./team-select";

type StatusUpdateFormProps = {
  organizationSlug: string;
  statusUpdateId: string;
  readonly?: boolean;
};

function StatusUpdateFormUnmemoized({
  organizationSlug,
  statusUpdateId,
  readonly = true,
}: StatusUpdateFormProps) {
  const navigate = useNavigate();
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
    resolver: zodResolver(updateStatusUpdateContract.inputSchema),
    defaultValues: {
      idOrSlug: organizationSlug,
      statusUpdateId: statusUpdateId,
      emoji: statusUpdate.data?.emoji ?? null,
      items: statusUpdate.data?.items.map((item) => ({
        id: item.id,
        order: item.order,
        content: item.content,
        isBlocker: item.isBlocker ?? false,
        isInProgress: item.isInProgress ?? false,
      })),
      mood: statusUpdate.data?.mood ?? null,
      notes: statusUpdate.data?.notes ?? null,
      teamId: statusUpdate.data?.teamId ?? null,
      editorJson: statusUpdate.data?.editorJson ?? null,
      effectiveFrom: statusUpdate.data?.effectiveFrom
        ? dayjs.utc(statusUpdate.data.effectiveFrom).toISOString()
        : dayjs.utc().startOf("day").toISOString(),
      effectiveTo: statusUpdate.data?.effectiveTo
        ? dayjs.utc(statusUpdate.data.effectiveTo).toISOString()
        : dayjs.utc().endOf("day").toISOString(),
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
          id: item.id,
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
      form.setValue("effectiveFrom", dayjs.utc(statusUpdate.data.effectiveFrom).toISOString());
      form.setValue("effectiveTo", dayjs.utc(statusUpdate.data.effectiveTo).toISOString());
      form.setValue("isDraft", statusUpdate.data.isDraft ?? true);
    }
  }, [statusUpdate.data]);

  const effectiveFrom = form.watch("effectiveFrom");
  const queryClient = useQueryClient();
  const updateStatusUpdate = useMutation(
    typedMutationOptions(updateStatusUpdateContract, {
      onSuccess: (data) => {
        const date = dayjs(data.effectiveFrom).format("YYYY-MM-DD");
        queryClient.invalidateQueries(
          typedQueryOptions(listStatusUpdatesByDateContract, {
            idOrSlug: organizationSlug,
            date,
          }),
        );
        queryClient.setQueryData(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }).queryKey,
          data,
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }),
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: date,
          }),
        );
        navigate({
          to: "/$organizationSlug/status-updates/$statusUpdateId",
          params: { organizationSlug, statusUpdateId: data.id },
          replace: true,
        });
      },
    }),
  );

  const generateStatusUpdate = useMutation(
    typedMutationOptions(generateStatusUpdateContract, {
      onSuccess: (data) => {
        const date = dayjs(data.effectiveFrom).format("YYYY-MM-DD");
        queryClient.invalidateQueries(
          typedQueryOptions(listStatusUpdatesByDateContract, {
            idOrSlug: organizationSlug,
            date,
          }),
        );
        queryClient.setQueryData(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }).queryKey,
          data,
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }),
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: date,
          }),
        );
        form.reset();
        navigate({
          to: "/$organizationSlug/status-updates/$statusUpdateId",
          params: { organizationSlug, statusUpdateId: data.id },
          replace: true,
        });
      },
    }),
  );

  const save = useCallback(
    (values: typeof updateStatusUpdateContract.$infer.input) => {
      if (updateStatusUpdate.isPending || generateStatusUpdate.isPending) {
        return;
      }
      updateStatusUpdate.mutate(values);
    },
    [updateStatusUpdate.isPending, generateStatusUpdate.isPending],
  );

  const debouncedSave = useDebouncedCallback(save, 600);

  const onDateChange = useCallback(
    (date: string) => {
      const nextEffectiveFrom = dayjs.utc(date).startOf("day").toISOString();
      const nextEffectiveTo = dayjs.utc(date).endOf("day").toISOString();
      form.setValue("effectiveFrom", nextEffectiveFrom);
      form.setValue("effectiveTo", nextEffectiveTo);
      const editorJson = form.getValues("editorJson") as any;
      if (editorJson?.content[0]?.attrs?.date) {
        editorJson.content[0].attrs.date = nextEffectiveFrom;
        form.setValue("editorJson", editorJson);
      }
      const isSame = deepEqual(
        {
          date: statusUpdate.data?.effectiveFrom.toISOString(),
          emoji: statusUpdate.data?.emoji,
          mood: statusUpdate.data?.mood,
          notes: statusUpdate.data?.notes,
          items: statusUpdate.data?.items.map((item) => ({
            id: item.id,
            order: item.order,
            content: item.content,
            isBlocker: item.isBlocker ?? false,
            isInProgress: item.isInProgress ?? false,
          })),
          editorJson: statusUpdate.data?.editorJson,
        },
        {
          date: nextEffectiveFrom,
          emoji: form.getValues("emoji"),
          mood: form.getValues("mood"),
          notes: form.getValues("notes"),
          items: form.getValues("items")?.map((item, index) => ({
            id: statusUpdate.data?.items[index]?.id ?? generateId(),
            order: item.order,
            content: item.content,
            isBlocker: item.isBlocker ?? false,
            isInProgress: item.isInProgress ?? false,
          })),
          editorJson: editorJson,
        },
      );
      if (
        !statusUpdate.isPending &&
        !updateStatusUpdate.isPending &&
        !generateStatusUpdate.isPending &&
        !organization.isPending &&
        !readonly &&
        !isSame
      ) {
        form.handleSubmit((values) => debouncedSave(values))();
      }
    },
    [
      form.getValues,
      statusUpdate.isPending,
      updateStatusUpdate.isPending,
      generateStatusUpdate.isPending,
      organization.isPending,
      readonly,
      debouncedSave,
    ],
  );

  const onUpdate = useCallback(
    (data: AsyncStatusEditorOnUpdateArgs) => {
      form.setValue("emoji", data.moodEmoji);
      form.setValue("mood", data.mood);
      form.setValue("notes", data.notes);
      form.setValue(
        "items",
        data.statusUpdateItems.map((item, index) => ({
          id: statusUpdate.data?.items[index]?.id ?? generateId(),
          order: item.order,
          content: item.content,
          isBlocker: item.isBlocker ?? false,
          isInProgress: item.isInProgress ?? false,
        })),
      );
      const nextEffectiveFrom = dayjs.utc(data.date).startOf("day").toISOString();
      const nextEffectiveTo = dayjs.utc(data.date).endOf("day").toISOString();
      if ((data.editorJson as any)?.content?.[0]?.attrs?.date) {
        (data.editorJson as any).content[0].attrs.date = nextEffectiveFrom;
      }
      form.setValue("editorJson", data.editorJson);
      form.setValue("effectiveFrom", nextEffectiveFrom);
      form.setValue("effectiveTo", nextEffectiveTo);
      const isSame = deepEqual(
        {
          date: statusUpdate.data?.effectiveFrom.toISOString(),
          emoji: statusUpdate.data?.emoji,
          mood: statusUpdate.data?.mood,
          notes: statusUpdate.data?.notes,
          items: statusUpdate.data?.items.map((item) => ({
            id: item.id,
            order: item.order,
            content: item.content,
            isBlocker: item.isBlocker ?? false,
            isInProgress: item.isInProgress ?? false,
          })),
          editorJson: statusUpdate.data?.editorJson,
        },
        {
          date: data.date,
          emoji: data.moodEmoji,
          mood: data.mood,
          notes: data.notes,
          items: data.statusUpdateItems.map((item, index) => ({
            id: statusUpdate.data?.items[index]?.id ?? generateId(),
            order: item.order,
            content: item.content,
            isBlocker: item.isBlocker ?? false,
            isInProgress: item.isInProgress ?? false,
          })),
          editorJson: data.editorJson,
        },
      );
      if (
        !statusUpdate.isPending &&
        !updateStatusUpdate.isPending &&
        !generateStatusUpdate.isPending &&
        !organization.isPending &&
        !readonly &&
        !isSame
      ) {
        form.handleSubmit((values) => debouncedSave(values))();
      }
    },
    [
      debouncedSave,
      organization.isPending,
      updateStatusUpdate.isPending,
      statusUpdate.isPending,
      generateStatusUpdate.isPending,
      readonly,
    ],
  );

  const initialContent = useMemo(() => {
    return statusUpdate.data?.editorJson ?? null;
  }, [JSON.stringify(statusUpdate.data?.editorJson ?? {})]);

  const date = useMemo(() => {
    return dayjs.utc(effectiveFrom).startOf("day").toISOString();
  }, [effectiveFrom]);

  return (
    <Form {...form}>
      <AsyncStatusEditor
        key={generateStatusUpdate.isPending ? "generating" : "ready"}
        date={date}
        readonly={readonly || generateStatusUpdate.isPending}
        localStorageKeyPrefix={`${organization.data?.member.id}-${statusUpdateId}`}
        initialContent={initialContent}
        onDateChange={onDateChange}
        onUpdate={onUpdate}
      >
        {!readonly && (
          <>
            <TeamSelect
              placeholder="Select team"
              organizationSlug={organizationSlug}
              value={form.watch("teamId") ?? undefined}
              onSelect={(teamId) => {
                form.setValue("teamId", teamId ?? null);
                form.handleSubmit((values) => save(values))();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={generateStatusUpdate.isPending || updateStatusUpdate.isPending}
              onClick={() => {
                form.setValue("isDraft", true);
                form.handleSubmit((values) => save(values))();
              }}
            >
              <BookDashed className="size-4" />
              Save as draft
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={generateStatusUpdate.isPending || updateStatusUpdate.isPending}
              onClick={() => {
                const effectiveFrom = dayjs.utc(date).startOf("day").toISOString();
                const effectiveTo = dayjs.utc(date).endOf("day").toISOString();
                generateStatusUpdate.mutate({
                  idOrSlug: organizationSlug,
                  effectiveFrom: effectiveFrom,
                  effectiveTo: effectiveTo,
                });
              }}
            >
              <Sparkles className="size-4" />
              {generateStatusUpdate.isPending ? "Generating..." : "Generate items"}
              {generateStatusUpdate.isPending && (
                <span className="text-xs text-muted-foreground">
                  It usually takes 10-20 seconds
                </span>
              )}
            </Button>
            <Button
              size="sm"
              disabled={generateStatusUpdate.isPending || updateStatusUpdate.isPending}
              onClick={() => {
                form.setValue("isDraft", false);
                form.handleSubmit((values) => save(values))();
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

export const StatusUpdateForm = memo(StatusUpdateFormUnmemoized, (prev, next) => {
  return (
    prev.organizationSlug === next.organizationSlug &&
    prev.statusUpdateId === next.statusUpdateId &&
    prev.readonly === next.readonly
  );
});
