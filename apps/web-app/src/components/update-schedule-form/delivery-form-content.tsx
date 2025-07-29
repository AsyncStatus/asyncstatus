import type { updateScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import { Button } from "@asyncstatus/ui/components/button";
import { PlusIcon } from "@asyncstatus/ui/icons";
import { useFormContext } from "react-hook-form";
import { FormField } from "../form";
import { DeliveryMethodSelect } from "./delivery-method-select";

export type DeliveryFormContentProps = {
  organizationSlug: string;
  scheduleId: string;
};

export function DeliveryFormContent(props: DeliveryFormContentProps) {
  const form = useFormContext<typeof updateScheduleContract.$infer.input>();
  const deliveryMethods = form.watch("config.deliveryMethods");
  const deliverToEveryone = form.watch("config.deliverToEveryone");
  const isAddingDeliveryMethods = deliveryMethods?.findIndex((field) => field === undefined) !== -1;

  return (
    <div className="flex items-start flex-col gap-4">
      <div className="flex items-center gap-2">
        {deliveryMethods?.length === 0 && (
          <FormField
            control={form.control}
            name="config.deliveryMethods"
            render={({ field }) => (
              <DeliveryMethodSelect
                organizationSlug={props.organizationSlug}
                type={deliverToEveryone ? "everyone" : undefined}
                value={undefined}
                onSelect={(type, value) => {
                  if (type === undefined) {
                    form.setValue("config.deliverToEveryone", false);
                    field.onChange([]);
                    return;
                  }

                  if (type === "everyone") {
                    form.setValue("config.deliverToEveryone", true);
                    field.onChange([]);
                    return;
                  }

                  form.setValue("config.deliverToEveryone", false);
                  field.onChange([{ type, value }]);
                }}
              />
            )}
          />
        )}

        {deliveryMethods?.map((deliveryMethod, index) => (
          <FormField
            key={`${deliveryMethod?.type}-${deliveryMethod?.value}`}
            control={form.control}
            name="config.deliveryMethods"
            render={({ field }) => (
              <DeliveryMethodSelect
                organizationSlug={props.organizationSlug}
                type={field.value?.[index]?.type}
                value={field.value?.[index]?.value}
                onSelect={(type, value) => {
                  if (type === undefined) {
                    form.setValue("config.deliverToEveryone", false);
                    field.onChange(field.value?.filter((_, i) => i !== index) ?? []);
                    return;
                  }

                  if (type === "everyone") {
                    form.setValue("config.deliverToEveryone", true);
                    field.onChange(field.value?.filter((_, i) => i !== index) ?? []);
                    return;
                  }

                  form.setValue("config.deliverToEveryone", false);
                  field.onChange(
                    field.value?.map((field, i) => (i === index ? { type, value } : field)) ?? [],
                  );
                }}
              />
            )}
          />
        ))}
      </div>

      {!isAddingDeliveryMethods && (
        <FormField
          control={form.control}
          name="config.deliveryMethods"
          render={({ field }) => (
            <Button
              size="sm"
              variant="outline"
              className="text-muted-foreground"
              onClick={() => {
                field.onChange([...(field.value ?? []), { type: undefined, value: undefined }]);
              }}
            >
              <PlusIcon className="size-4" />
              Add delivery method
            </Button>
          )}
        />
      )}
    </div>
  );
}
