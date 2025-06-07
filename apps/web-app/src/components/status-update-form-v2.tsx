import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
import { Button } from "@asyncstatus/ui/components/button";
import { Form } from "@asyncstatus/ui/components/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { StatusUpdateEditorV2 } from "./status-update-editor-v2";

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
        <div className="mx-auto h-full w-full">
          <StatusUpdateEditorV2 />
        </div>

        {/* <div className="grid h-full gap-4 md:grid-cols-2">
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
        </div> */}

        {/* <Button type="submit" className="w-full">
          Post update
        </Button> */}
      </form>
    </Form>
  );
}
