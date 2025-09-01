import {
  listChangelogsByRepoContract,
  startChangelogGenerationContract,
} from "@asyncstatus/changelog-api/typed-handlers/changelog";
import { dayjs } from "@asyncstatus/dayjs";
import { Button } from "@asyncstatus/ui/components/button";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { ArrowRightIcon } from "@asyncstatus/ui/icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { ChangelogHeader, ChangelogHeaderSkeleton } from "@/components/changelog-header";
import { Footer } from "@/components/footer";
import { Markdown } from "@/components/markdown";
import { typedContractFetch, typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$owner/$repo/")({
  component: RouteComponent,
  pendingComponent: () => {
    return (
      <div className="w-full h-full overflow-hidden">
        <ChangelogHeaderSkeleton withoutSubheader />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      </div>
    );
  },
  loader: async ({ params, context: { queryClient } }) => {
    const { changelogs, changelogGenerationJobs } = await queryClient.ensureQueryData(
      typedQueryOptions(
        listChangelogsByRepoContract,
        { owner: params.owner, repo: params.repo },
        { throwOnError: false },
      ),
    );

    if (
      changelogs.length === 0 &&
      (changelogGenerationJobs.length === 0 ||
        changelogGenerationJobs.some((job) => job.state === "error"))
    ) {
      const now = dayjs();
      const filters = `${now.subtract(1, "week").format("YYYY-MM-DD")}..${now.format("YYYY-MM-DD")}`;
      const nextChangelogGenerationJob = await typedContractFetch(
        startChangelogGenerationContract,
        { url: `https://github.com/${params.owner}/${params.repo}`, filters },
      );
      queryClient.setQueryData(
        typedQueryOptions(listChangelogsByRepoContract, { owner: params.owner, repo: params.repo })
          .queryKey,
        { changelogs, changelogGenerationJobs: [nextChangelogGenerationJob] },
      );
      throw redirect({
        to: `/$owner/$repo/$filters`,
        params: { owner: params.owner, repo: params.repo, filters },
      });
    }

    return { changelogs, changelogGenerationJobs };
  },
  head: async ({ params }) => {
    return {
      meta: [{ title: `${params.owner}/${params.repo} changelogs - Changelogs AI` }],
    };
  },
});

function RouteComponent() {
  const { owner, repo } = Route.useParams();
  const changelogsByRepo = useQuery(
    typedQueryOptions(
      listChangelogsByRepoContract,
      { owner, repo },
      {
        placeholderData: keepPreviousData,
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
      <ChangelogHeader owner={owner} repo={repo} showBigHeader={Boolean(mostRecentChangelog)} />

      <main className="min-h-[100dvh]">
        {mostRecentChangelogGenerationJob && (
          <div className="text-center h-dvh flex items-center justify-center w-full">
            <h1 className="text-5xl">{mostRecentChangelogJobStatus}</h1>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
          {changelogsByRepo?.data?.changelogs.map((changelog, index) => {
            const rangeStart = changelog.rangeStart ? dayjs(changelog.rangeStart) : undefined;
            const rangeEnd = changelog.rangeEnd ? dayjs(changelog.rangeEnd) : undefined;
            const commitStart = changelog.fromCommitSha ? changelog.fromCommitSha : undefined;
            const commitEnd = changelog.toCommitSha ? changelog.toCommitSha : undefined;
            const filters =
              rangeStart && rangeEnd
                ? `${rangeStart.format("YYYY-MM-DD")}..${rangeEnd.format("YYYY-MM-DD")}`
                : commitStart && commitEnd
                  ? `${commitStart}..${commitEnd}`
                  : undefined;
            const tldr = changelog.content.slice(0, 600).split("## TL;DR").join("");

            return (
              <div className="p-4 border border-border rounded-3xl shadow-2xl/10">
                {rangeStart && rangeEnd && (
                  <motion.p
                    layout="position"
                    layoutId={`changelog-${changelog.slug}-subheader`}
                    className="text-2xl"
                  >
                    {rangeStart.format("MMM D, YYYY")} - {rangeEnd.format("MMM D, YYYY")}
                  </motion.p>
                )}
                {commitStart && commitEnd && (
                  <motion.p
                    layout="position"
                    layoutId={`changelog-${changelog.slug}-subheader`}
                    className="text-2xl"
                  >
                    {commitStart} - {commitEnd}
                  </motion.p>
                )}
                <div className="relative text-muted-foreground my-1 mb-2 line-clamp-7">
                  <Markdown size="sm" variant="primary">
                    {tldr}
                  </Markdown>
                  <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-background to-transparent" />
                </div>
                <div className="text-xl text-muted-foreground">
                  <Button asChild variant={index === 0 ? "default" : "outline"} className="w-full">
                    <Link
                      to="/$owner/$repo/$filters"
                      params={{
                        owner,
                        repo,
                        filters: filters!,
                      }}
                    >
                      See more
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function firstLetterCapitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
