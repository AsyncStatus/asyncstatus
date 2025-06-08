import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
import { AsyncStatusEditor } from "@asyncstatus/editor";
import { Button } from "@asyncstatus/ui/components/button";
import { Form } from "@asyncstatus/ui/components/form";
import {
  BookCheck,
  BookDashed,
  RocketIcon,
  SaveIcon,
  SendIcon,
} from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  teamId: z.string().optional(),
  effectiveFrom: z.date(),
  effectiveTo: z.date(),
  mood: z.string().optional(),
  emoji: z.string().optional(),
  isDraft: z.boolean().default(true),
});

type StatusUpdateFormProps = {
  organizationSlug: string;
};

export function StatusUpdateForm({ organizationSlug }: StatusUpdateFormProps) {
  const { data } = useQuery(getOrganizationQueryOptions(organizationSlug));

  const member = data?.member;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: member?.id,
      effectiveFrom: new Date(),
      effectiveTo: new Date(),
      isDraft: true,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <AsyncStatusEditor>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline">
              <BookDashed className="size-4" />
              Save as draft
            </Button>
            <Button size="sm" type="submit">
              <BookCheck className="size-4" />
              Publish
            </Button>
          </div>
        </AsyncStatusEditor>
      </form>
    </Form>
  );
}
