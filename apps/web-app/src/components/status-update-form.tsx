import { useState } from "react";
import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
import { Button } from "@asyncstatus/ui/components/button";
import { Calendar } from "@asyncstatus/ui/components/calendar";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@asyncstatus/ui/components/emoji-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@asyncstatus/ui/components/form";
import { Input } from "@asyncstatus/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@asyncstatus/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { Switch } from "@asyncstatus/ui/components/switch";
import { Textarea } from "@asyncstatus/ui/components/textarea";
import { CalendarIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { rpc } from "../rpc/rpc";

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
  onSuccess?: () => void;
};

export function StatusUpdateForm({
  organizationSlug,
  onSuccess,
}: StatusUpdateFormProps) {
  const { data } = useQuery(getOrganizationQueryOptions(organizationSlug));

  const organization = data?.organization;
  const member = data?.member;

  const [statusItems, setStatusItems] = useState<
    Array<{ content: string; isBlocker: boolean; order: number }>
  >([{ content: "", isBlocker: false, order: 0 }]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: member?.id,
      effectiveFrom: new Date(),
      effectiveTo: new Date(),
      isDraft: true,
    },
  });

  // Fetch teams for dropdown
  const { data: teamsData } = useQuery({
    queryKey: ["teams", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const response = await rpc.organization[":idOrSlug"].teams.$get({
        param: { idOrSlug: organization.id },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
    enabled: !!organization?.id,
  });

  // Create status update mutation
  const createStatusUpdate = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await rpc.organization[":idOrSlug"][
        "status-update"
      ].$post({
        param: { idOrSlug: organizationSlug },
        json: values,
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Create status items
      const validItems = statusItems.filter(
        (item) => item.content.trim() !== "",
      );

      for (const item of validItems) {
        const itemResponse = await rpc.organization[":idOrSlug"][
          "status-update"
        ].item.$post({
          param: { idOrSlug: organizationSlug },
          json: {
            statusUpdateId: data.id,
            content: item.content,
            isBlocker: item.isBlocker,
            order: item.order,
          },
        });

        if (!itemResponse.ok) {
          throw await itemResponse.json();
        }
      }

      toast.success("Status update created");
      form.reset();
      setStatusItems([{ content: "", isBlocker: false, order: 0 }]);
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error("Failed to create status update");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createStatusUpdate.mutate(values);
  }

  function addStatusItem() {
    setStatusItems([
      ...statusItems,
      { content: "", isBlocker: false, order: statusItems.length },
    ]);
  }

  function removeStatusItem(index: number) {
    if (statusItems.length > 1) {
      const newItems = [...statusItems];
      newItems.splice(index, 1);
      // Update orders
      const reorderedItems = newItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));
      setStatusItems(reorderedItems);
    }
  }

  function updateStatusItem(index: number, field: string, value: any) {
    const newItems = [...statusItems];
    const currentItem = newItems[index] || {
      content: "",
      isBlocker: false,
      order: index,
    };

    newItems[index] = {
      ...currentItem,
      [field]: value,
    };

    setStatusItems(newItems);
  }

  // Extract teams from the response for the dropdown
  const teams = Array.isArray(teamsData) ? teamsData : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team (optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a team this status update is related to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emoji"
            render={({ field }) => {
              const [isOpen, setIsOpen] = useState(false);
              return (
                <FormItem>
                  <FormLabel>Mood emoji (optional)</FormLabel>
                  <FormControl>
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Input {...field} placeholder="😊" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit p-0">
                        <EmojiPicker
                          className="h-[342px]"
                          onEmojiSelect={(emoji) => {
                            field.onChange(emoji.emoji);
                            setIsOpen(false);
                          }}
                        >
                          <EmojiPickerSearch />
                          <EmojiPickerContent />
                          <EmojiPickerFooter />
                        </EmojiPicker>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormDescription>
                    How are you feeling about this update?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="effectiveFrom"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Effective from</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When does this status update start being effective?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effectiveTo"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Effective to</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When does this status update end?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Status Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStatusItem}
            >
              Add Item
            </Button>
          </div>

          {statusItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-1">
                <Textarea
                  placeholder="What's your status update?"
                  value={item.content}
                  onChange={(e) =>
                    updateStatusItem(index, "content", e.target.value)
                  }
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex flex-col space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={item.isBlocker}
                    onCheckedChange={(checked) =>
                      updateStatusItem(index, "isBlocker", checked)
                    }
                  />
                  <span className="text-sm">Blocker</span>
                </div>
                {statusItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStatusItem(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="isDraft"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Save as draft</FormLabel>
                <FormDescription>
                  Keep this as a draft until you're ready to publish
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createStatusUpdate.isPending}
        >
          {createStatusUpdate.isPending
            ? "Creating..."
            : "Create Status Update"}
        </Button>
      </form>
    </Form>
  );
}
