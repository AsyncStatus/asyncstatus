import { listReposByOwnerContract } from "@asyncstatus/changelog-api/typed-handlers/changelog";
import { Button } from "@asyncstatus/ui/components/button";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { ArrowRightIcon, BugIcon, EyeIcon, GitBranch, StarIcon } from "@asyncstatus/ui/icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChangelogHeader, ChangelogHeaderSkeleton } from "@/components/changelog-header";
import { Footer } from "@/components/footer";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$owner/")({
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
    const repos = await queryClient.ensureQueryData(
      typedQueryOptions(listReposByOwnerContract, { owner: params.owner }, { throwOnError: false }),
    );

    return { repos };
  },
  head: async ({ params }) => {
    return {
      meta: [{ title: `${params.owner} - Changelogs AI` }],
    };
  },
});

function RouteComponent() {
  const { owner } = Route.useParams();
  const repos = useQuery(
    typedQueryOptions(listReposByOwnerContract, { owner }, { placeholderData: keepPreviousData }),
  );

  return (
    <div className="w-full h-full">
      <ChangelogHeader owner={owner} showBigHeader={Boolean(repos.data?.length > 0)} />

      <div className="min-h-[100dvh]">
        <main className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          {repos.data?.map((repo) => (
            <div
              key={repo.id}
              className="flex flex-col gap-1 p-4 border border-border rounded-3xl shadow-2xl/10"
            >
              <motion.p
                layout="position"
                layoutId={`${repo.repoName}-header`}
                className="text-xl truncate"
                title={repo.repoName}
              >
                {repo.repoName}
              </motion.p>

              <div className="flex-1 flex flex-col gap-1 text-muted-foreground">
                <p className="text-sm truncate" title={repo.description}>
                  {repo.description}
                </p>

                <div className="flex items-center gap-4 text-muted-foreground">
                  <a
                    href={`${repo.htmlUrl}/stargazers`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 hover:text-black active:text-black focus:text-black transition-colors duration-75"
                  >
                    <StarIcon className="size-4" />
                    {repo.stargazersCount}
                  </a>
                  <a
                    href={`${repo.htmlUrl}/watchers`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 hover:text-black active:text-black focus:text-black transition-colors duration-75"
                  >
                    <EyeIcon className="size-4" />
                    {repo.watchersCount}
                  </a>
                  <a
                    href={`${repo.htmlUrl}/forks`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 hover:text-black active:text-black focus:text-black transition-colors duration-75"
                  >
                    <GitBranch className="size-4" />
                    {repo.forksCount}
                  </a>
                  <a
                    href={`${repo.htmlUrl}/issues`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 hover:text-black active:text-black focus:text-black transition-colors duration-75"
                  >
                    <BugIcon className="size-4" />
                    {repo.openIssuesCount}
                  </a>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link to="/$owner/$repo" params={{ owner, repo: repo.repoName }}>
                  See changelogs
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
          ))}
        </main>
      </div>

      <Footer />
    </div>
  );
}
