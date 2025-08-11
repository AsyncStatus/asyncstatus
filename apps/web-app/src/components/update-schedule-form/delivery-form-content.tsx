import type { updateScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import { useFormContext } from "react-hook-form";
import { FormField } from "../form";
import { DeliveryMethodsSelect } from "./delivery-methods-select";

export type DeliveryFormContentProps = {
  organizationSlug: string;
  scheduleId: string;
};

export function DeliveryFormContent(props: DeliveryFormContentProps) {
  const form = useFormContext<typeof updateScheduleContract.$infer.input>();

  return (
    <div className="flex items-start flex-col gap-4">
      <FormField
        control={form.control}
        name="config.deliveryMethods"
        render={({ field }) => (
          <DeliveryMethodsSelect
            organizationSlug={props.organizationSlug}
            values={(field.value as any) ?? []}
            onSelect={(value) => {
              field.onChange(value);
            }}
          />
        )}
      />
    </div>
  );
}
