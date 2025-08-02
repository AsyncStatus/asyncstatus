import { Badge } from "@asyncstatus/ui/components/badge";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import { toast } from "@asyncstatus/ui/components/sonner";
import { CheckIcon } from "@asyncstatus/ui/icons";

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  description: string;
  popular: boolean;
  features: string[];
};

export function PricingPlanCard({
  pricingPlan,
  currentPlan,
  isAdmin,
  isLoading,
  onSelect,
}: {
  pricingPlan: PricingPlan;
  currentPlan: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const isCurrent = currentPlan === pricingPlan.id;

  return (
    <Card className={`flex flex-col h-full ${pricingPlan.popular ? "border-primary" : ""}`}>
      <CardHeader className=" text-center py-6">
        <CardTitle className="relative mb-4">
          {pricingPlan.popular && (
            <Badge className="uppercase w-max self-center text-[0.6rem] absolute -top-6 left-1/2 -translate-x-1/2">
              Most popular
            </Badge>
          )}
          {pricingPlan.name}
        </CardTitle>
        <span className="font-bold text-4xl">{pricingPlan.price}</span>
        {pricingPlan.id !== "enterprise" && <span className="text-muted-foreground">/month</span>}
      </CardHeader>
      <CardDescription className="text-center px-6 pb-4">{pricingPlan.description}</CardDescription>
      <CardContent className="flex-1">
        <ul className="space-y-2.5 text-sm">
          {pricingPlan.features.map((feature) => (
            <li key={feature} className="flex space-x-2">
              <CheckIcon className="flex-shrink-0 mt-0.5 h-4 w-4" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrent ? "outline" : pricingPlan.popular ? "default" : "outline"}
          disabled={isLoading}
          onClick={() => {
            if (isCurrent) {
              toast.info("You are already on this plan.");
              return;
            }

            if (!isAdmin) {
              toast.info("Only admins and owners can change plans.");
              return;
            }

            onSelect();
          }}
        >
          {isCurrent
            ? "Current Plan"
            : pricingPlan.id === "enterprise"
              ? "Schedule a call"
              : "Select Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}
