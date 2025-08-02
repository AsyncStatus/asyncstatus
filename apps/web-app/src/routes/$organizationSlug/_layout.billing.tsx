import { purchaseAdditionalGenerationsContract } from "@asyncstatus/api/typed-handlers/ai-usage";
import { getMemberContract } from "@asyncstatus/api/typed-handlers/member";
import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import {
  cancelStripeSubscriptionContract,
  createPortalSessionContract,
  generateStripeCheckoutContract,
  getSubscriptionContract,
  reactivateStripeSubscriptionContract,
  stripeSuccessContract,
  syncSubscriptionContract,
} from "@asyncstatus/api/typed-handlers/stripe";
import { dayjs } from "@asyncstatus/dayjs";
import { SiStripe } from "@asyncstatus/ui/brand-icons";
import { Alert, AlertDescription, AlertTitle } from "@asyncstatus/ui/components/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Badge } from "@asyncstatus/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@asyncstatus/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { Label } from "@asyncstatus/ui/components/label";
import { type PricingPlan, PricingPlanCard } from "@asyncstatus/ui/components/pricing-plan-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Textarea } from "@asyncstatus/ui/components/textarea";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CreditCardIcon,
  PlusIcon,
  RefreshCwIcon,
  ZapIcon,
} from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod/v4";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { ensureValidOrganization, ensureValidSession } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/billing")({
  validateSearch: z.object({
    payment: z.enum(["success", "cancelled", "error"]).optional(),
    message: z.string().optional(),
  }),
  component: RouteComponent,
  loader: async ({ context: { queryClient }, location, params: { organizationSlug } }) => {
    const [organization] = await Promise.all([
      ensureValidOrganization(queryClient, organizationSlug),
      ensureValidSession(queryClient, location),
    ]);

    await Promise.all([
      queryClient.ensureQueryData(
        typedQueryOptions(getOrganizationContract, {
          idOrSlug: organizationSlug,
        }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(getMemberContract, {
          idOrSlug: organizationSlug,
          memberId: organization.member.id,
        }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(getSubscriptionContract, { idOrSlug: organizationSlug }),
      ),
    ]);
  },
});

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "$9",
    description: "For small teams and trying out AsyncStatus. 14 days free trial.",
    popular: false,
    features: [
      "5 users",
      "2 teams",
      "Slack, GitHub integrations",
      "2 customizable schedules",
      "Chat with activity data",
      "100 AI generations/month",
      "Basic support",
    ],
  },
  {
    id: "startup",
    name: "Startup",
    price: "$49",
    description: "For teams that want to get started with AsyncStatus. 14 days free trial.",
    popular: true,
    features: [
      "Unlimited users",
      "Unlimited teams",
      "All integrations",
      "Unlimited customizable schedules",
      "Chat with activity data",
      "500 AI generations/month",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Schedule a call",
    description: "For bigger teams and enterprises that need advanced features.",
    popular: false,
    features: [
      "Unlimited users",
      "Unlimited teams",
      "All integrations",
      "Unlimited customizable schedules",
      "Chat with activity data",
      "Unlimited AI generations with best models available",
      "API access",
      "SSO with SAML",
      "Dedicated support",
    ],
  },
] satisfies PricingPlan[];

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showInfoModal = Boolean(search.payment);
  const organizationQuery = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: params.organizationSlug }),
  );
  const subscriptionQuery = useQuery(
    typedQueryOptions(getSubscriptionContract, { idOrSlug: params.organizationSlug }),
  );

  const currentPlan = getCurrentPlan(subscriptionQuery.data);
  const isAdmin =
    organizationQuery.data?.member.role === "admin" ||
    organizationQuery.data?.member.role === "owner";

  const generateCheckoutMutation = useMutation(
    typedMutationOptions(generateStripeCheckoutContract, {
      onSuccess: (data) => {
        window.location.href = data.checkoutUrl;
      },
    }),
  );

  const syncSubscriptionMutation = useMutation(
    typedMutationOptions(syncSubscriptionContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getSubscriptionContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
      },
    }),
  );

  const handleSelectPlan = (planId: string) => {
    if (!isAdmin) return;

    if (planId === "enterprise") {
      window.open("https://cal.com/kacper/15min", "_blank");
      return;
    }

    generateCheckoutMutation.mutate({
      plan: planId as "basic" | "startup",
      successUrl: `${typedUrl(stripeSuccessContract, {
        idOrSlug: params.organizationSlug,
        sessionId: "{CHECKOUT_SESSION_ID}",
      })}?sessionId={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${import.meta.env.VITE_WEB_APP_URL}/${params.organizationSlug}/billing?payment=cancelled`,
      idOrSlug: params.organizationSlug,
    });
  };

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/$organizationSlug/billing"
                    params={{ organizationSlug: params.organizationSlug }}
                  >
                    Billing
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <form
            action={typedUrl(createPortalSessionContract, { idOrSlug: params.organizationSlug })}
            method="post"
          >
            <Button variant="outline" size="sm" type="submit">
              <SiStripe className="size-4" />
              Manage in Stripe
            </Button>
          </form>

          {isAdmin && !subscriptionQuery.data?.customTrial && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncSubscriptionMutation.mutate({ idOrSlug: params.organizationSlug })}
              disabled={syncSubscriptionMutation.isPending}
            >
              <RefreshCwIcon
                className={`size-4 ${syncSubscriptionMutation.isPending ? "animate-spin" : ""}`}
              />
              Sync
            </Button>
          )}
        </div>
      </header>

      <AlertDialog
        open={showInfoModal}
        onOpenChange={(open) =>
          !open &&
          navigate({
            to: "/$organizationSlug/billing",
            params: { organizationSlug: params.organizationSlug },
            search: {},
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            {search.payment === "success" && (
              <>
                <AlertDialogTitle className="flex items-center gap-2">
                  <CheckCircleIcon className="size-6 text-green-500" />
                  Payment Successful!
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Your subscription has been activated successfully.
                </AlertDialogDescription>
              </>
            )}
            {search.payment === "cancelled" && (
              <>
                <AlertDialogTitle>Payment Cancelled</AlertDialogTitle>
                <AlertDialogDescription>Your payment has been cancelled.</AlertDialogDescription>
              </>
            )}
            {search.payment === "error" && (
              <>
                <AlertDialogTitle>Payment Error</AlertDialogTitle>
                <AlertDialogDescription>
                  There was an issue processing your payment. Please try again or contact support if
                  the problem persists.
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          {search.payment === "error" && (
            <p>{search.message ?? "There was an issue processing your payment."}</p>
          )}
          {search.payment === "success" && (
            <p>
              {search.message ??
                "Thank you for your purchase! You can now start using AsyncStatus with your new plan."}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-2 mt-4">
        {generateCheckoutMutation.error && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Checkout Error</AlertTitle>
            <AlertDescription>
              There was an issue creating your checkout session. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Plan Selection */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <CurrentPlanCard
              className="col-span-1 md:col-span-3"
              organizationSlug={params.organizationSlug}
            />
            <UsageCard
              className="col-span-1 md:col-span-3"
              organizationSlug={params.organizationSlug}
            />
            {plans.map((plan) => (
              <PricingPlanCard
                key={plan.id}
                pricingPlan={plan}
                currentPlan={subscriptionQuery.data?.customTrial ? null : currentPlan}
                isAdmin={isAdmin}
                isLoading={generateCheckoutMutation.isPending}
                onSelect={() => handleSelectPlan(plan.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function getCurrentPlan(subscription: typeof getSubscriptionContract.$infer.output): string | null {
  if (!subscription) return null;

  // Check for custom trial first
  if (subscription.customTrial && subscription.customTrial.status === "active") {
    return subscription.customTrial.plan;
  }

  // Return the plan name from Stripe subscription
  if (subscription.status === "active" || subscription.status === "trialing") {
    return subscription.planName;
  }

  return null;
}

function CurrentPlanCard({
  className,
  organizationSlug,
}: {
  className?: string;
  organizationSlug: string;
}) {
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<
    | "too_expensive"
    | "missing_features"
    | "switching_service"
    | "no_longer_needed"
    | "customer_service"
    | "low_quality"
    | "unused"
    | "other"
    | ""
  >("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const subscriptionQuery = useQuery(
    typedQueryOptions(getSubscriptionContract, { idOrSlug: organizationSlug }),
  );
  const organizationQuery = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
  );
  const cancelSubscriptionMutation = useMutation(
    typedMutationOptions(cancelStripeSubscriptionContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getSubscriptionContract, {
            idOrSlug: organizationSlug,
          }).queryKey,
        });
      },
    }),
  );

  const reactivateSubscriptionMutation = useMutation(
    typedMutationOptions(reactivateStripeSubscriptionContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getSubscriptionContract, {
            idOrSlug: organizationSlug,
          }).queryKey,
        });
      },
    }),
  );

  const currentPlan = getCurrentPlan(subscriptionQuery.data);
  const isAdmin =
    organizationQuery.data?.member.role === "admin" ||
    organizationQuery.data?.member.role === "owner";

  const handleCancelSubscription = () => {
    if (cancelReason === "") return;

    cancelSubscriptionMutation.mutate({
      idOrSlug: organizationSlug,
      reason: cancelReason,
      feedback: cancelFeedback || undefined,
    });

    setCancelDialogOpen(false);
    setCancelReason("");
    setCancelFeedback("");
  };

  if (!subscriptionQuery.data) return null;

  const isCustomTrial =
    subscriptionQuery.data.customTrial && subscriptionQuery.data.customTrial.status === "active";
  const isStripeTrial = subscriptionQuery.data.status === "trialing" && !isCustomTrial;
  const isActive =
    subscriptionQuery.data.status === "active" ||
    subscriptionQuery.data.status === "trialing" ||
    isCustomTrial;

  let statusText: string = subscriptionQuery.data.status;
  if (isCustomTrial) {
    statusText = "Free Trial";
  } else if (isStripeTrial) {
    statusText = "Trial";
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="size-5" />
            Current Plan
          </CardTitle>
          <Badge variant={isActive ? "default" : "destructive"}>
            {statusText[0]?.toUpperCase() + statusText.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {currentPlan && (
          <div>
            <h3 className="font-semibold text-lg">
              {plans.find((p) => p.id === currentPlan)?.name || "Unknown Plan"}
            </h3>
            {!isCustomTrial && (
              <p className="text-muted-foreground">
                {plans.find((p) => p.id === currentPlan)?.price}/month
              </p>
            )}
          </div>
        )}

        {/* Custom trial information */}
        {isCustomTrial && subscriptionQuery.data.customTrial && (
          <div>
            <p className="text-sm text-muted-foreground">
              Free trial ends in{" "}
              {dayjs(subscriptionQuery.data.customTrial.endDate * 1000).fromNow()} (
              {dayjs(subscriptionQuery.data.customTrial.endDate * 1000).format("DD MMM YYYY")})
            </p>
          </div>
        )}

        {/* Stripe subscription information */}
        {subscriptionQuery.data.currentPeriodEnd && !isCustomTrial && (
          <div>
            <p className="text-sm text-muted-foreground">
              {subscriptionQuery.data.status === "canceled"
                ? "Active until"
                : subscriptionQuery.data.cancelAtPeriodEnd
                  ? "Expires"
                  : "Renews"}{" "}
              on {dayjs(subscriptionQuery.data.currentPeriodEnd * 1000).format("DD MMM YYYY")}
            </p>
          </div>
        )}

        {/* Stripe trial information */}
        {subscriptionQuery.data.trialEnd && isStripeTrial && (
          <div>
            <p className="text-sm text-muted-foreground">
              Trial ends on {dayjs(subscriptionQuery.data.trialEnd * 1000).format("DD MMM YYYY")}
            </p>
          </div>
        )}

        {subscriptionQuery.data.status === "canceled" && (
          <div>
            <p className="text-sm text-muted-foreground">
              Your subscription has been cancelled. You can reactivate it at any time.
            </p>
          </div>
        )}

        {/* Show when subscription is set to cancel at period end */}
        {subscriptionQuery.data.cancelAtPeriodEnd && subscriptionQuery.data.currentPeriodEnd && (
          <div>
            <p className="text-xs text-muted-foreground">
              Your subscription will be cancelled at the end of your billing period on{" "}
              {dayjs(subscriptionQuery.data.currentPeriodEnd * 1000).format("DD MMM YYYY")}.
            </p>
          </div>
        )}

        {subscriptionQuery.data.paymentMethod && (
          <div>
            <p className="text-sm text-muted-foreground">
              Payment method: **** **** **** {subscriptionQuery.data.paymentMethod.last4} (
              {subscriptionQuery.data.paymentMethod.brand})
            </p>
          </div>
        )}

        {/* Subscription Actions - Only show for non-trial active subscriptions */}
        {isAdmin &&
          !isCustomTrial &&
          (subscriptionQuery.data.status === "active" ||
            subscriptionQuery.data.status === "trialing") && (
            <div className="pt-4 flex justify-end space-x-2">
              {!subscriptionQuery.data.cancelAtPeriodEnd ? (
                // Show cancel button when subscription is not set to cancel
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Subscription</DialogTitle>
                      <DialogDescription>
                        We're sorry to see you go. Your subscription will remain active until the
                        end of your current billing period.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="cancel-reason">Why are you canceling? *</Label>
                        <Select
                          value={cancelReason}
                          onValueChange={(value) => setCancelReason(value as typeof cancelReason)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Please select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="too_expensive">Too expensive</SelectItem>
                            <SelectItem value="missing_features">
                              Missing features I need
                            </SelectItem>
                            <SelectItem value="switching_service">
                              Switching to another service
                            </SelectItem>
                            <SelectItem value="no_longer_needed">No longer needed</SelectItem>
                            <SelectItem value="customer_service">
                              Customer service issues
                            </SelectItem>
                            <SelectItem value="low_quality">Quality concerns</SelectItem>
                            <SelectItem value="unused">Not using the service</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cancel-feedback">Additional feedback (optional)</Label>
                        <Textarea
                          id="cancel-feedback"
                          placeholder="Help us improve by sharing your feedback..."
                          value={cancelFeedback}
                          onChange={(e) => setCancelFeedback(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        disabled={cancelReason === ""}
                      >
                        Cancel Subscription
                      </Button>

                      <Button
                        autoFocus
                        variant="outline"
                        onClick={() => setCancelDialogOpen(false)}
                      >
                        Keep Subscription
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                // Show reactivate button when subscription is set to cancel
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    reactivateSubscriptionMutation.mutate({ idOrSlug: organizationSlug })
                  }
                  disabled={reactivateSubscriptionMutation.isPending}
                >
                  <ArrowLeftIcon className="size-4" />
                  Don't Cancel Subscription
                </Button>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function UsageCard({
  className,
  organizationSlug,
}: {
  className?: string;
  organizationSlug: string;
}) {
  const queryClient = useQueryClient();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"add_25" | "add_100">("add_25");

  const subscriptionQuery = useQuery(
    typedQueryOptions(getSubscriptionContract, { idOrSlug: organizationSlug }),
  );
  const organizationQuery = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
  );

  const purchaseGenerationsMutation = useMutation(
    typedMutationOptions(purchaseAdditionalGenerationsContract, {
      onSuccess: (data) => {
        if (data.success) {
          // Refresh subscription data to get updated usage
          queryClient.invalidateQueries({
            queryKey: typedQueryOptions(getSubscriptionContract, {
              idOrSlug: organizationSlug,
            }).queryKey,
          });
          setPurchaseDialogOpen(false);
        } else if (data.clientSecret) {
          // @TODO: Handle 3D Secure authentication - would need Stripe Elements integration. For now, just show a message
          alert("Additional authentication required. Please contact support.");
        }
      },
      onError: (error) => {
        console.error("Purchase failed:", error);
      },
    }),
  );

  const isAdmin =
    organizationQuery.data?.member.role === "admin" ||
    organizationQuery.data?.member.role === "owner";

  const usage = subscriptionQuery.data?.usage;
  const hasSubscription = Boolean(subscriptionQuery.data);

  if (!usage || !hasSubscription) return null;

  const usagePercentage = Math.min((usage.currentMonth.used / usage.currentMonth.limit) * 100, 100);
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usage.currentMonth.used >= usage.currentMonth.limit;

  const handlePurchaseGenerations = () => {
    if (!isAdmin) return;

    purchaseGenerationsMutation.mutate({
      idOrSlug: organizationSlug,
      option: selectedOption,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ZapIcon className="size-5" />
            AI usage this month
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Usage Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Usage</span>
              <span className="text-muted-foreground">
                {usage.currentMonth.remaining} remaining
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isOverLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Usage Breakdown */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Status Updates</p>
              <p className="font-medium">{usage.currentMonth.byType.status_generation}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Summaries</p>
              <p className="font-medium">{usage.currentMonth.byType.summary_generation}</p>
            </div>
          </div>

          {/* Purchase Additional Generations */}
          {isAdmin && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Need more generations?</p>
                  <p className="text-xs text-muted-foreground">
                    Purchase additional credits that never expire
                  </p>
                </div>
                <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        if (subscriptionQuery.data?.customTrial) {
                          e.preventDefault();
                          toast.error(
                            "You're on a free trial, you didn't provide a payment method. Please upgrade to a paid plan to purchase additional credits",
                            {
                              id: "custom-trial-toast",
                              position: "top-center",
                              duration: 10_000,
                            },
                          );
                          return;
                        }
                      }}
                    >
                      <PlusIcon className="size-4" />
                      Buy more credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Purchase additional credits</DialogTitle>
                      <DialogDescription>
                        Add more AI generations to your account. Credits never expire.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Choose your package</Label>
                        <Select
                          value={selectedOption}
                          onValueChange={(value) =>
                            setSelectedOption(value as typeof selectedOption)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add_25">25 generations - $5</SelectItem>
                            <SelectItem value="add_100">100 generations - $15</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Current balance:</span>
                          <span>{usage.currentMonth.remaining}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>After purchase:</span>
                          <span className="font-medium">
                            {usage.currentMonth.remaining +
                              (selectedOption === "add_25" ? 25 : 100)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        onClick={handlePurchaseGenerations}
                        disabled={purchaseGenerationsMutation.isPending}
                      >
                        {purchaseGenerationsMutation.isPending
                          ? "Purchasing..."
                          : `Purchase now for ${selectedOption === "add_25" ? "$5" : "$15"}`}
                      </Button>
                      <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Usage Warning */}
          {isOverLimit && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="size-4" />
              <AlertTitle>Usage Limit Reached</AlertTitle>
              <AlertDescription>
                You've reached your monthly generation limit. Purchase additional generations to
                continue using AI features.
              </AlertDescription>
            </Alert>
          )}

          {isNearLimit && !isOverLimit && (
            <Alert>
              <AlertTriangleIcon className="size-4" />
              <AlertTitle>Approaching Usage Limit</AlertTitle>
              <AlertDescription>
                You're approaching your monthly generation limit. Consider purchasing additional
                generations to avoid interruption.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
