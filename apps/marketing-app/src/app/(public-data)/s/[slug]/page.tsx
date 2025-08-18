import { getPublicStatusUpdateContract } from "@asyncstatus/api/typed-handlers/public-status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { Badge } from "@asyncstatus/ui/components/badge";
import { AlertTriangle } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { typedContractFetch } from "@/app/(public-data)/typed-handlers";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const slug = (await params).slug;
  const data = await typedContractFetch(getPublicStatusUpdateContract, { slug });
  const updateStatusItemsText = getUpdateStatusItemsText(data.items);
  const firstName = getFirstName(
    data.member.user.name.includes("@")
      ? data.member.user.name.split("@")[0]
      : data.member.user.name,
  );
  const date = getDate(data.effectiveFrom, data.effectiveTo);

  return {
    title: `${firstName}'s status update for ${date}`,
    description: updateStatusItemsText,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const data = await typedContractFetch(getPublicStatusUpdateContract, { slug });
  const hasAnyBlockers = data.items.some((item) => item.isBlocker);
  const updateStatusItemsText = getUpdateStatusItemsText(data.items);
  const firstName = getFirstName(
    data.member.user.name.includes("@")
      ? data.member.user.name.split("@")[0]
      : data.member.user.name,
  );
  const date = getDate(data.effectiveFrom, data.effectiveTo);

  return (
    <main className="container mx-auto flex flex-col items-center justify-center pb-16">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.2) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      <Badge variant="outline" className="mb-2 text-muted-foreground bg-background z-10">
        {date}
      </Badge>

      <h1 className="text-center text-5xl p-2 text-balance font-bold z-10 bg-background rounded-lg">
        {firstName}'s status update
      </h1>

      <div className="bg-background p-1 mt-1.5 z-10 w-fit rounded-lg">
        {hasAnyBlockers && (
          <p className="inline-block text-sm text-destructive mr-1">
            <AlertTriangle className="size-3 text-destructive inline-block -translate-y-0.5" />
            This update has blockers.
          </p>
        )}
        <p className="inline-block text-sm text-muted-foreground">{updateStatusItemsText}.</p>
      </div>

      <div className="relative rounded-lg bg-background border border-border/70 mt-6 z-30 px-12 py-12 max-sm:px-4 max-sm:py-4 max-sm:mx-2 shadow-[0px_20px_50px_-4px_rgba(0,_0,_0,_0.08)]">
        <ol className="leading-relaxed [&>li+li]:mt-2">
          {data.items.map((statusUpdateItem) => (
            <li
              key={`${statusUpdateItem.id}${statusUpdateItem.order}${statusUpdateItem.isBlocker}${statusUpdateItem.isInProgress}`}
              className="relative pl-4"
            >
              <div
                className={cn(
                  "absolute left-0 top-2.5 size-2 rounded-full bg-muted-foreground/60",
                  !statusUpdateItem.isInProgress && !statusUpdateItem.isBlocker && "bg-green-500",
                  statusUpdateItem.isBlocker && "bg-destructive",
                )}
              />

              <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
                {statusUpdateItem.content}
              </Markdown>
            </li>
          ))}
        </ol>

        {data.notes && (
          <div className="mt-4 z-10 bg-background p-2 rounded-lg max-w-2xl leading-snug">
            <h2 className="text-xl font-medium">Notes</h2>
            <Markdown remarkPlugins={remarkPlugins} components={smallerMarkdownComponents}>
              {data.notes}
            </Markdown>
          </div>
        )}

        {data.mood && (
          <div className="mt-4 z-10 bg-background p-2 rounded-lg max-w-2xl leading-snug">
            <h2 className="text-xl font-medium">Mood</h2>
            <Markdown remarkPlugins={remarkPlugins} components={smallerMarkdownComponents}>
              {data.mood}
            </Markdown>
          </div>
        )}

        {/* <div className="absolute right-1 bottom-1 z-10 bg-background p-2 rounded-lg flex items-end justify-end w-full">
          <Link href="/" className="flex items-center gap-1">
            <p className="text-sm font-medium max-sm:text-xs">Generated with</p>
            <AsyncStatusLogo className="size-3 w-auto" />
            <p className="text-sm font-medium max-sm:text-xs">AsyncStatus</p>
          </Link>
        </div> */}
      </div>

      <div className="mt-10 z-10 bg-background p-4 rounded-lg text-balance text-center">
        <h3 className="text-lg font-medium">Async status updates for remote startups.</h3>

        <p className="text-base text-muted-foreground mt-2">
          We've built this open-source tool for high-agency teams that value their time. It takes
          less than 1 minute to generate your own status update (from GitHub, Slack or Discord).{" "}
          <Link href="/" className="text-primary underline hover:text-primary/80">
            Generate your own status update
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function getDate(effectiveFrom: Date, effectiveTo: Date) {
  const from = dayjs(effectiveFrom);
  const to = dayjs(effectiveTo);
  if (from.isSame(to, "day")) {
    return from.format("MMMM D, YYYY");
  }
  return `${from.format("MMMM D, YYYY")} - ${to.format("MMMM D, YYYY")}`;
}

function upperFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getFirstName(name: string) {
  return upperFirst(name.split(" ")[0] ?? name);
}

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

function getUpdateStatusItemsText(
  items: (typeof getPublicStatusUpdateContract.$infer.output)["items"],
) {
  const blockersCount = items.filter((item) => item.isBlocker).length;
  const doneCount = items.filter((item) => !item.isInProgress && !item.isBlocker).length;
  const inProgressCount = items.filter((item) => item.isInProgress).length;

  const blockersText =
    blockersCount > 0 ? `${blockersCount} blocker${blockersCount === 1 ? "" : "s"}` : undefined;
  let inProgressText = inProgressCount > 0 ? `${inProgressCount} in progress` : undefined;
  let doneText = doneCount > 0 ? `${doneCount} done` : undefined;

  if (doneText) {
    doneText = `${doneText} item${items.length === 1 ? "" : "s"}`;
  } else if (inProgressText) {
    inProgressText = `${inProgressText} item${items.length === 1 ? "" : "s"}`;
  }

  return formatter.format([blockersText, inProgressText, doneText].filter(Boolean) as string[]);
}

const remarkPlugins = [remarkGfm];

const markdownComponents = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xl underline break-all hover:text-primary focus:text-primary active:text-primary transition-colors duration-100"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <span className="text-xl">{children}</span>,
  strong: ({ children }) => <strong className="text-xl">{children}</strong>,
  em: ({ children }) => <em className="text-xl">{children}</em>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-0.5 py-0.5 text-xl">{children}</code>
  ),
} satisfies Components;

const smallerMarkdownComponents = {
  ...markdownComponents,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-base underline break-all hover:text-primary focus:text-primary active:text-primary transition-colors duration-100"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <span className="text-base">{children}</span>,
  strong: ({ children }) => <strong className="text-base">{children}</strong>,
  em: ({ children }) => <em className="text-base">{children}</em>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-0.5 py-0.5 text-base">{children}</code>
  ),
} satisfies Components;
