import { updateMemberContract } from "@asyncstatus/api/typed-handlers/member";
import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import { dayjs } from "@asyncstatus/dayjs";
import { toast } from "@asyncstatus/ui/components/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export function MemberTimezoneChecker() {
  const { organizationSlug } = useParams({ from: "/$organizationSlug" });
  const queryClient = useQueryClient();
  const interval = useRef<NodeJS.Timeout | null>(null);
  const session = useQuery(sessionBetterAuthQueryOptions());
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, {
      idOrSlug: organizationSlug,
    }),
  );
  const updateMember = useMutation(
    typedMutationOptions(updateMemberContract, {
      onSuccess: (data) => {
        toast.success("Timezone updated", {
          description: `Your timezone has been updated to ${data.user.timezone} (from ${session.data?.user.timezone}).`,
        });

        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getOrganizationContract, {
            idOrSlug: organizationSlug,
          }).queryKey,
        });

        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            user: { ...sessionData.user, ...data.user },
          };
        });
      },
      onError: (error) => {
        toast.error("Failed to update timezone", {
          description: error.message,
        });
      },
      throwOnError: false,
    }),
  );

  const checkAndUpdateTimezone = useCallback(() => {
    if (updateMember.isPending || !session.data?.user.autoDetectTimezone) {
      return;
    }

    const currentTimezone = dayjs.tz.guess();
    if (currentTimezone !== session.data?.user.timezone) {
      updateMember.mutate({
        idOrSlug: organizationSlug,
        memberId: organization.data.member.id,
        timezone: currentTimezone,
      });
    }
  }, [
    session.data?.user.timezone,
    organizationSlug,
    organization.data?.member.id,
    updateMember.isPending,
    session.data?.user.autoDetectTimezone,
  ]);

  useEffect(() => {
    checkAndUpdateTimezone();

    interval.current = setInterval(checkAndUpdateTimezone, 60000);

    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [checkAndUpdateTimezone]);

  useEffect(() => {
    window.addEventListener("focus", checkAndUpdateTimezone);
    return () => {
      window.removeEventListener("focus", checkAndUpdateTimezone);
    };
  }, [checkAndUpdateTimezone]);

  return null;
}
