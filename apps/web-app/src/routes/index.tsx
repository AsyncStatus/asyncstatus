import { Button } from "@asyncstatus/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";

import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: App,
  beforeLoad: () => {},
  loader: () => {},
});

function App() {
  const session = authClient.useSession();

  if (session.isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8">
      {session.data && (
        <h2 className="text-center text-3xl">
          Welcome {session.data.user?.name}
        </h2>
      )}

      {!session.data && (
        <h2 className="text-center text-3xl">Welcome to AsyncStatus</h2>
      )}

      {session.data && (
        <Button onClick={() => authClient.signOut()}>Sign out</Button>
      )}
      {!session.data && (
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="lg">
            <Link to="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/sign-up">Sign up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
