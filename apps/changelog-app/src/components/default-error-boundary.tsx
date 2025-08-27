import { TypedHandlersError } from "@asyncstatus/typed-handlers";
import { Badge } from "@asyncstatus/ui/components/badge";
import { Button } from "@asyncstatus/ui/components/button";
import { Noise } from "@asyncstatus/ui/components/noise";
import { useQueryClient } from "@tanstack/react-query";
import { type ErrorComponentProps, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export function DefaultErrorBoundary({ error }: Readonly<ErrorComponentProps>) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      setIsDarkMode(e.matches);
    });
    return () => mediaQuery.removeEventListener("change", (e) => setIsDarkMode(e.matches));
  }, []);

  return (
    <div className="relative h-[calc(100%+2rem)] w-[calc(100%+2rem)] -my-2.5 -mx-4 rounded-lg overflow-hidden p-2">
      <Noise patternAlpha={isDarkMode ? 25 : 100} className="z-10 mix-blend-hard-light" />

      <div className="flex flex-col items-center justify-center h-full w-full z-20">
        <ErrorContent error={error} />
      </div>
    </div>
  );
}

function ErrorContent(props: { error: ErrorComponentProps["error"] }) {
  const [isTryingAgain, setIsTryingAgain] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const location = useLocation();
  const description = useMemo(() => {
    if (props.error instanceof Error) {
      return props.error.message;
    }

    return "We're sorry, but something went wrong. Please try again.";
  }, [props.error]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2 leading-relaxed text-center">
      {props.error instanceof TypedHandlersError && (
        <Badge variant="secondary" className="-mt-4">
          {props.error.code}
        </Badge>
      )}
      <h2 className="text-5xl font-bold mt-0.5 mb-2 max-sm:text-3xl">Something went wrong</h2>
      <h3 className="text-lg text-muted-foreground text-pretty max-w-md max-sm:text-sm">
        {description}
      </h3>
      <div className="flex gap-2 mt-2">
        <Button variant="secondary" asChild size="lg">
          <a href="mailto:kacper@asyncstatus.com">Contact support</a>
        </Button>

        <Button
          size="lg"
          onClick={async () => {
            setIsTryingAgain(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            await queryClient.invalidateQueries();
            await router.invalidate();
            await router.navigate({ to: location.pathname, search: {}, replace: true });
            setIsTryingAgain(false);
          }}
        >
          {isTryingAgain ? "Trying again..." : "Try again"}
        </Button>
      </div>
    </div>
  );
}
