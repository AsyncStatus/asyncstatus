import { getScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import {
  getScheduleDeliveryContract,
  upsertScheduleDeliveryContract,
} from "@asyncstatus/api/typed-handlers/schedule-delivery";
import { SiSlack } from "@asyncstatus/ui/brand-icons";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@asyncstatus/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@asyncstatus/ui/components/popover";
import { cn } from "@asyncstatus/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, ChevronsUpDown, Mail } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useDebouncedCallback from "@/lib/use-debounced-callback";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { Form, FormControl, FormField, FormItem } from "../form";

export type UpsertScheduleDeliveryFormProps = {
  organizationSlug: string;
  scheduleId: string;
  deliveryId?: string;
};

const deliveryMethods = [
  { value: "email", label: "Email", icon: Mail },
  { value: "slack", label: "Slack", icon: SiSlack },
] as const;

function UpsertScheduleDeliveryFormUnmemoized(props: UpsertScheduleDeliveryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const delivery = useQuery(
    typedQueryOptions(
      getScheduleDeliveryContract,
      props.deliveryId
        ? {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
            deliveryId: props.deliveryId,
          }
        : skipToken,
      { initialData: keepPreviousData },
    ),
  );

  const upsertDelivery = useMutation(
    typedMutationOptions(upsertScheduleDeliveryContract, {
      onSuccess: (data) => {
        queryClient.setQueryData(
          typedQueryOptions(getScheduleContract, {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
          }).queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              deliveries: [
                ...oldData.deliveries.filter((delivery) => delivery.id !== data.id),
                data,
              ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
            };
          },
        );
        if (data.id) {
          queryClient.setQueryData(
            typedQueryOptions(getScheduleDeliveryContract, {
              idOrSlug: props.organizationSlug,
              scheduleId: props.scheduleId,
              deliveryId: data.id,
            }).queryKey,
            data,
          );
        }
      },
    }),
  );

  const form = useForm({
    resolver: zodResolver(upsertScheduleDeliveryContract.inputSchema),
    defaultValues: {
      id: props.deliveryId,
      idOrSlug: props.organizationSlug,
      scheduleId: props.scheduleId,
      deliveryMethod: delivery.data?.deliveryMethod,
    },
  });

  useEffect(() => {
    form.reset({
      id: props.deliveryId,
      idOrSlug: props.organizationSlug,
      scheduleId: props.scheduleId,
      deliveryMethod: delivery.data?.deliveryMethod,
    });
  }, [delivery.data?.deliveryMethod, props.deliveryId, props.organizationSlug, props.scheduleId]);

  const onSubmit = useCallback(
    (data: typeof upsertScheduleDeliveryContract.$infer.input) => {
      if (form.formState.isSubmitting || !form.formState.isValid || !form.formState.isDirty) {
        return;
      }
      upsertDelivery.mutate(data);
    },
    [upsertDelivery, form.formState.isSubmitting, form.formState.isValid, form.formState.isDirty],
  );

  const debouncedOnSubmit = useDebouncedCallback(onSubmit, 500);

  useEffect(() => {
    if (form.formState.isSubmitting || !form.formState.isValid || !form.formState.isDirty) {
      return;
    }
    debouncedOnSubmit(form.getValues());
  }, [
    debouncedOnSubmit,
    form.formState.isSubmitting,
    form.formState.isValid,
    form.formState.isDirty,
  ]);

  const deliveryMethod = form.watch("deliveryMethod");
  const label = useMemo(() => {
    const method = deliveryMethods.find((method) => method.value === deliveryMethod);
    if (!method) {
      return "Select delivery method";
    }
    const Icon = method.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{method.label}</span>
      </div>
    );
  }, [deliveryMethod]);

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="deliveryMethod"
        render={({ field }) => (
          <FormItem>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  {/** biome-ignore lint/a11y/useSemanticElements: it's fine to use a button as a combobox */}
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className="w-full justify-between"
                  >
                    {label}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search delivery methods..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No delivery methods found.</CommandEmpty>
                    <CommandGroup>
                      {deliveryMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <CommandItem
                            key={method.value}
                            value={method.value}
                            onSelect={() => {
                              form.setValue("deliveryMethod", method.value);
                              field.onChange(method.value);
                              setIsOpen(false);
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{method.label}</span>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                deliveryMethod === method.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />
    </Form>
  );
}

export const UpsertScheduleDeliveryForm = memo(
  UpsertScheduleDeliveryFormUnmemoized,
  (prevProps, nextProps) => {
    return (
      prevProps.organizationSlug === nextProps.organizationSlug &&
      prevProps.scheduleId === nextProps.scheduleId &&
      prevProps.deliveryId === nextProps.deliveryId
    );
  },
);
