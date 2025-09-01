import { getCommitRange, getDateRange } from "@asyncstatus/changelog-api/filters";
import {
  listChangelogsByRepoContract,
  startChangelogGenerationContract,
} from "@asyncstatus/changelog-api/typed-handlers/changelog";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { ChangelogHeader, ChangelogHeaderSkeleton } from "@/components/changelog-header";
import { Footer } from "@/components/footer";
import { Markdown } from "@/components/markdown";
import { typedContractFetch, typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$owner/$repo/$filters/")({
  component: RouteComponent,
  pendingComponent: () => {
    return (
      <div className="w-full h-full overflow-hidden">
        <ChangelogHeaderSkeleton />
        <div className="prose prose-neutral dark:prose-invert prose-base mx-auto pb-24">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="mt-5 h-6 w-full" />
          <Skeleton className="mt-1 h-6 w-full" />
          <Skeleton className="mt-1 h-6 w-3/4" />

          <Skeleton className="mt-12 h-10 w-56" />
          <Skeleton className="mt-5 h-6 ml-6.5 w-full" />
          <Skeleton className="mt-1 h-6 ml-6.5 w-1/2" />
          <Skeleton className="mt-3.5 h-6 ml-6.5 w-full" />
          <Skeleton className="mt-1 h-6 ml-6.5 w-5/6" />
          <Skeleton className="mt-3.5 h-6 ml-6.5 w-full" />
          <Skeleton className="mt-1 h-6 ml-6.5 w-1/4" />
          <Skeleton className="mt-3.5 h-6 ml-6.5 w-full" />
          <Skeleton className="mt-1 h-6 ml-6.5 w-full" />
          <Skeleton className="mt-1 h-6 ml-6.5 w-2/3" />

          <Skeleton className="mt-18 h-10 w-32" />
          <Skeleton className="mt-5 h-6 ml-6.5 w-full" />
          <Skeleton className="mt-1 h-6 ml-6.5 w-1/2" />
        </div>
      </div>
    );
  },
  loader: async ({ params, context: { queryClient } }) => {
    const { changelogs, changelogGenerationJobs } = await queryClient.ensureQueryData(
      typedQueryOptions(
        listChangelogsByRepoContract,
        { owner: params.owner, repo: params.repo, filters: params.filters },
        { throwOnError: false },
      ),
    );

    if (
      changelogs.length === 0 &&
      (changelogGenerationJobs.length === 0 ||
        changelogGenerationJobs.some((job) => job.state === "error"))
    ) {
      const nextChangelogGenerationJob = await typedContractFetch(
        startChangelogGenerationContract,
        {
          url: `https://github.com/${params.owner}/${params.repo}`,
          filters: params.filters,
        },
      );
      queryClient.setQueryData(
        typedQueryOptions(listChangelogsByRepoContract, {
          owner: params.owner,
          repo: params.repo,
          filters: params.filters,
        }).queryKey,
        { changelogs, changelogGenerationJobs: [nextChangelogGenerationJob] },
      );
      return { changelogs, changelogGenerationJobs: [nextChangelogGenerationJob] };
    }

    return { changelogs, changelogGenerationJobs };
  },
  head: ({ params }) => {
    const dateRange = getDateRange(params.filters);
    if (dateRange) {
      return {
        meta: [
          {
            title: `${params.owner}/${params.repo} ${dateRange.start.format("MMM D, YYYY")} - ${dateRange.end.format("MMM D, YYYY")} changelog - Changelogs AI`,
          },
        ],
      };
    }

    const commitRange = getCommitRange(params.filters);
    if (commitRange) {
      return {
        meta: [
          {
            title: `${params.owner}/${params.repo} ${commitRange.start}..${commitRange.end} changelog - Changelogs AI`,
          },
        ],
      };
    }

    return {
      meta: [{ title: `${params.owner}/${params.repo} unknown changelog - Changelogs AI` }],
    };
  },
});

function RouteComponent() {
  const { owner, repo, filters } = Route.useParams();

  const changelogsByRepo = useQuery(
    typedQueryOptions(
      listChangelogsByRepoContract,
      { owner, repo, filters },
      {
        placeholderData: keepPreviousData,
        throwOnError: false,
        refetchInterval(query) {
          if (
            query.state.data?.changelogGenerationJobs?.some(
              (job) => job.state === "done" || job.state === "error",
            )
          ) {
            return false;
          }
          return 1000;
        },
      },
    ),
  );

  const mostRecentChangelog = useMemo(
    () => changelogsByRepo?.data?.changelogs[0],
    [changelogsByRepo?.data?.changelogs],
  );
  const mostRecentChangelogGenerationJob = useMemo(
    () => (!mostRecentChangelog ? changelogsByRepo?.data?.changelogGenerationJobs[0] : undefined),
    [changelogsByRepo?.data?.changelogGenerationJobs, mostRecentChangelog],
  );
  const mostRecentChangelogJobStatus = useMemo(() => {
    const status =
      mostRecentChangelogGenerationJob?.metadata?.humanReadableStatus ??
      mostRecentChangelogGenerationJob?.state;
    if (!status) {
      return;
    }
    return firstLetterCapitalize(status);
  }, [mostRecentChangelogGenerationJob]);

  return (
    <div className="w-full h-full">
      <ChangelogHeader
        owner={owner}
        repo={repo}
        filters={filters}
        slug={mostRecentChangelog?.slug}
        showBigHeader={Boolean(mostRecentChangelog)}
      />

      <main className="min-h-[100dvh]">
        {mostRecentChangelogGenerationJob && (
          <motion.div className="text-center h-dvh flex items-center justify-center w-full">
            <motion.h1
              layout
              layoutId="changelog-header"
              className="text-7xl"
              initial={{
                scale: 1,
                opacity: 1,
              }}
              animate={{
                scale: [1, 0.9, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                scale: {
                  duration: 3.6,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: [0.5, 1, 0.89, 1],
                },
                opacity: {
                  duration: 3.6,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: [0.5, 1, 0.89, 1],
                },
                ease: [0.5, 1, 0.89, 1],
                duration: 0.25,
              }}
            >
              {mostRecentChangelogJobStatus}
            </motion.h1>
          </motion.div>
        )}

        {mostRecentChangelog && (
          <motion.div className="prose prose-neutral dark:prose-invert prose-base mx-auto pb-24 max-sm:px-4">
            <Markdown>{mostRecentChangelog?.content}</Markdown>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function firstLetterCapitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
