import { getSubscriptionContract } from "@asyncstatus/api/typed-handlers/stripe";
import { toast } from "@asyncstatus/ui/components/sonner";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { typedQueryOptions } from "@/typed-handlers";

export function OrganizationSubscriptionChecker() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams({
    from: "/$organizationSlug",
    shouldThrow: false,
  });

  const subscriptionQuery = useSuspenseQuery(
    typedQueryOptions(getSubscriptionContract, {
      idOrSlug: params?.organizationSlug || "",
    }),
  );

  useEffect(() => {
    if (subscriptionQuery.data?.status === "canceled") {
      toast.error(
        "Your subscription has been canceled. Please renew it to continue using AsyncStatus.",
        {
          id: "subscription-canceled",
          position: "top-center",
          duration: 10000,
          description: "Contact support if you need help.",
          action: {
            label: "Contact Support",
            onClick: () => {
              window.open("mailto:kacper@asyncstatus.com", "_blank");
            },
          },
        },
      );
      navigate({
        to: "/$organizationSlug/billing",
        params: { organizationSlug: params?.organizationSlug || "" },
        replace: true,
      });
    }
  }, [subscriptionQuery.data?.status, navigate, params?.organizationSlug, location]);

  return null;
}
