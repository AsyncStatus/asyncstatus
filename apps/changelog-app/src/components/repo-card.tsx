import { Button } from "@asyncstatus/ui/components/button";
import { ArrowRightIcon, BugIcon, EyeIcon, GitBranch, StarIcon } from "@asyncstatus/ui/icons";
import { Link } from "@tanstack/react-router";

type RepoCardProps = {
  owner: string;
  repo: string;
  description: string;
  stargazersCount: number;
  watchersCount: number;
  forksCount: number;
  openIssuesCount: number;
};

export function RepoCard({
  owner,
  repo,
  description,
  stargazersCount,
  watchersCount,
  forksCount,
  openIssuesCount,
}: RepoCardProps) {
  return (
    <div className="flex flex-col gap-1 p-4 border border-border/20 rounded-3xl shadow-2xl/10 bg-background/10 max-w-md">
      <p className="text-xl truncate text-white" title={`${owner}/${repo}`}>
        {owner}/{repo}
      </p>

      <div className="flex-1 flex flex-col gap-1 text-muted-foreground max-sm:gap-4">
        <p className="text-sm line-clamp-2 text-white/60" title={description}>
          {description}
        </p>

        <div className="flex items-center gap-4 text-muted-foreground">
          <a
            href={`https://github.com/${owner}/${repo}/stargazers`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 text-white/60 hover:text-white active:text-white focus:text-white transition-colors duration-75"
          >
            <StarIcon className="size-4" />
            {stargazersCount}
          </a>
          <a
            href={`https://github.com/${owner}/${repo}/watchers`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 text-white/60 hover:text-white active:text-white focus:text-white transition-colors duration-75"
          >
            <EyeIcon className="size-4" />
            {watchersCount}
          </a>
          <a
            href={`https://github.com/${owner}/${repo}/forks`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 text-white/60 hover:text-white active:text-white focus:text-white transition-colors duration-75"
          >
            <GitBranch className="size-4" />
            {forksCount}
          </a>
          <a
            href={`https://github.com/${owner}/${repo}/issues`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 text-white/60 hover:text-white active:text-white focus:text-white transition-colors duration-75"
          >
            <BugIcon className="size-4" />
            {openIssuesCount}
          </a>
        </div>
      </div>

      <Button asChild variant="ghost" className="w-full max-sm:mt-4 bg-white/20 text-white/80">
        <Link to="/$owner/$repo" params={{ owner, repo }}>
          See changelogs
          <ArrowRightIcon className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
