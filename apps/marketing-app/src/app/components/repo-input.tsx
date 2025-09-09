"use client";

import { ArrowRight } from "@asyncstatus/ui/icons";

export function RepoInput() {
  return (
    <>
      <p className="sm:hidden text-muted-foreground text-xs mb-2 text-left">github.com/</p>
      <form
        className="relative flex items-stretch justify-center w-full border border-neutral-300 rounded-lg overflow-hidden"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const ownerAndRepo = formData.get("ownerAndRepo") as string;
          const [owner, repo] = ownerAndRepo.split("/");
          // @TODO: navigate to https://changelogs.ai
        }}
      >
        <div className="relative flex items-center w-full">
          <p className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground select-none pointer-events-none max-sm:hidden">
            github.com/
          </p>
          <input
            name="ownerAndRepo"
            placeholder="asyncstatus/asyncstatus"
            className="flex-1 bg-black/5 min-w-[300px] pl-[6.26rem] max-sm:pl-4 pr-4 py-3 text-black placeholder-muted-foreground focus:outline-none focus:bg-white"
            onPaste={(e) => {
              const raw = e.clipboardData.getData("text");
              let text = raw.trim();
              if (text.startsWith("@")) text = text.slice(1).trim();
              text = text.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
              if (text.startsWith("github.com/")) {
                text = text.slice("github.com/".length);
              }
              text = text.split(/[?#]/)[0] ?? "";
              text = text.replace(/\.git$/i, "");
              const parts = text.split("/").filter(Boolean);
              if (parts.length >= 2) {
                text = `${parts[0]}/${parts[1]}`;
              }
              if (text !== raw) {
                e.preventDefault();
                e.currentTarget.value = text;
              }
            }}
          />
        </div>
        <button
          type="submit"
          className="px-4 text-sm bg-primary hover:bg-primary/80 leading-[1] whitespace-nowrap transition-colors border-l border-primary/30 group flex items-center justify-center min-w-[160px]"
        >
          <span className="text-primary-foreground">Generate updates</span>
          <ArrowRight className="ml-1 size-4 text-primary-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>
    </>
  );
}
