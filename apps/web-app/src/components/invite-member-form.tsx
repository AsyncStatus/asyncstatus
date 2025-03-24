import {
  inviteMemberMutationOptions,
  listMembersQueryOptions,
} from "@/rpc/organization";
import { zOrganizationCreateInvite } from "@asyncstatus/api/schema/organization";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@asyncstatus/ui/components/form";
import { Input } from "@asyncstatus/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { toast } from "@asyncstatus/ui/components/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

export function InviteMemberForm(props: {
  organizationSlug: string;
  onSuccess?: (data: {
    id: string;
    email: string;
    status: "pending" | "accepted" | "rejected" | "canceled";
    expiresAt: string;
    organizationId: string;
    role: string;
    inviterId: string;
    teamId?: string | undefined;
  }) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(zOrganizationCreateInvite),
    defaultValues: { email: "", role: "member" as const },
  });
  const inviteMember = useMutation({
    ...inviteMemberMutationOptions(),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(props.organizationSlug).queryKey,
      });
      props.onSuccess?.(data);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          inviteMember.mutate({
            param: { idOrSlug: props.organizationSlug },
            json: { email: data.email, role: data.role },
          });
        })}
        className="mx-auto w-full space-y-24"
      >
        <div className="grid gap-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-end justify-between">
                  <FormLabel>Email</FormLabel>
                </div>
                <FormControl>
                  <Input placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={inviteMember.isPending}
          >
            Invite member
          </Button>
        </div>
      </form>
    </Form>
  );
}
