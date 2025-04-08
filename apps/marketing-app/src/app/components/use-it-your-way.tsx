"use client";

export function UseItYourWay() {
  return (
    <div className="bg-muted/15 mt-16 rounded-lg border border-dashed p-6">
      <h3 className="text-2xl max-sm:text-lg">Make it work for you</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-border bg-muted/45 rounded-md border px-4 py-3">
          <span className="text-sm font-medium">No GitHub? No Slack?</span>
          <p className="text-muted-foreground text-sm">
            Type your updates manually. It's that simple.
          </p>
        </div>
        <div className="border-border bg-muted/45 rounded-md border px-4 py-3">
          <span className="text-sm font-medium">Don't want AI?</span>
          <p className="text-muted-foreground text-sm">
            Turn it off. We don't push features you don't need.
          </p>
        </div>
        <div className="border-border bg-muted/45 rounded-md border px-4 py-3">
          <span className="text-sm font-medium">Use what you want</span>
          <p className="text-muted-foreground text-sm">
            Connect the tools you use. Skip the ones you don't.
          </p>
        </div>
      </div>
    </div>
  );
}
