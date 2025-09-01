import _Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({
  children,
  size = "base",
  variant = "default",
}: {
  children: string;
  size?: "base" | "sm";
  variant?: "default" | "primary";
}) {
  return (
    <_Markdown
      remarkPlugins={remarkPlugins}
      components={
        size === "base"
          ? variant === "default"
            ? markdownComponents
            : markdownComponents
          : variant === "default"
            ? smallerMarkdownComponents
            : smallerPrimaryMarkdownComponents
      }
    >
      {children}
    </_Markdown>
  );
}

const remarkPlugins = [remarkGfm];

const markdownComponents = {
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
  h1: ({ children }) => <h1 className="text-3xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-bold font-stefan">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-bold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-bold">{children}</h4>,
  h5: ({ children }) => <h5 className="text-base font-bold">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-bold">{children}</h6>,
  p: ({ children }) => <span className="text-base">{children}</span>,
  strong: ({ children }) => <strong className="text-base">{children}</strong>,
  em: ({ children }) => <em className="text-base">{children}</em>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-0.5 py-0.5 text-base">{children}</code>
  ),
} satisfies Components;

const smallerMarkdownComponents = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm underline break-all hover:text-primary focus:text-primary active:text-primary transition-colors duration-100"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold font-stefan">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-bold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-bold">{children}</h4>,
  h5: ({ children }) => <h5 className="text-sm font-bold">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-bold">{children}</h6>,
  p: ({ children }) => <span className="text-sm">{children}</span>,
  strong: ({ children }) => <strong className="text-sm">{children}</strong>,
  em: ({ children }) => <em className="text-sm">{children}</em>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-0.5 py-0.5 text-sm">{children}</code>
  ),
} satisfies Components;

const smallerPrimaryMarkdownComponents = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm underline break-all hover:text-primary focus:text-primary active:text-primary transition-colors duration-100"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-bold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-bold">{children}</h4>,
  h5: ({ children }) => <h5 className="text-sm font-bold">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-bold">{children}</h6>,
  p: ({ children }) => <span className="text-sm">{children}</span>,
  strong: ({ children }) => <strong className="text-sm">{children}</strong>,
  em: ({ children }) => <em className="text-sm">{children}</em>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-0.5 py-0.5 text-sm">{children}</code>
  ),
} satisfies Components;
