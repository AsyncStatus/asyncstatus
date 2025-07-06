import { getInvitationContract } from "@asyncstatus/api/typed-handlers/invitation";
import { joinWaitlistContract } from "@asyncstatus/api/typed-handlers/waitlist";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const test2 = useMutation(typedMutationOptions(joinWaitlistContract));
  const test3 = useSuspenseQuery(
    typedQueryOptions(getInvitationContract, {
      id: "1",
      email: "test@test.com",
    }),
  );
  return null;
}
