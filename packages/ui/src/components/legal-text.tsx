import { cn } from "@asyncstatus/ui/lib/utils";
import type React from "react";

export const LegalHeading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <h2 className={cn("mt-8 mb-4 text-2xl font-semibold", className)}>{children}</h2>;

export const LegalSubheading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <h3 className={cn("mt-6 mb-3 text-xl font-medium", className)}>{children}</h3>;

export const LegalSmallHeading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <h4 className={cn("mt-5 mb-2 text-lg font-medium", className)}>{children}</h4>;

export const LegalParagraph = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <p className={cn("mb-4 text-base leading-relaxed", className)}>{children}</p>;

export const LegalList = ({
  children,
  ordered = false,
  className,
}: {
  children: React.ReactNode;
  ordered?: boolean;
  className?: string;
}) => {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <ListTag
      className={cn("mb-6 ml-6 list-disc space-y-2", className)}
      {...(ordered && { type: "1" })}
    >
      {children}
    </ListTag>
  );
};

export const LegalListAlpha = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <ol className={cn("mb-6 ml-6 space-y-2", className)} type="a">
    {children}
  </ol>
);

export const LegalListRoman = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <ol className={cn("mb-6 ml-6 space-y-2", className)} type="i">
    {children}
  </ol>
);

export const LegalListItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <li className={cn(className)}>{children}</li>;

export const LegalLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a href={href} className={cn("text-primary hover:underline", className)}>
    {children}
  </a>
);

export const LegalSection = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("mb-8", className)}>{children}</div>;

export const LegalDate = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <p className={cn("text-muted-foreground mb-6 text-sm italic", className)}>{children}</p>;

export const LegalStrong = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <strong className={cn("font-medium", className)}>{children}</strong>;

export const LegalDivider = ({ className }: { className?: string }) => (
  <hr className={cn("border-border my-8 border-t", className)} />
);

export const LegalDocument = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("space-y-4", className)}>{children}</div>;
