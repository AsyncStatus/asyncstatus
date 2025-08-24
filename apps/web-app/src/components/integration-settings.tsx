import { Button } from "@asyncstatus/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { toast } from "@asyncstatus/ui/components/sonner";
import { ExternalLink, Info, PlusCircle, Send } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { type PropsWithChildren, useState } from "react";

export type IntegrationSettingsItemProps = PropsWithChildren<{
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "connecting" | "disconnected" | "error";
  connectLink?: string;
  settingsChildren?: React.ReactNode;
  onViewDetails: () => void;
  onSettings: () => void;
  onDisconnect?: () => void;
  membersLinkedCount?: number;
  membersTotalCount?: number;
}>;

export function IntegrationSettingsItem(props: IntegrationSettingsItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 border border-border rounded-lg p-3 min-h-[150px] h-full">
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <div className="size-3.5">{props.icon}</div>
          <div className="text-lg">{props.name}</div>
        </div>
        <div className="text-sm text-muted-foreground text-pretty">{props.description}</div>

        {props.status === "connected" &&
          props.membersTotalCount != null &&
          props.membersLinkedCount != null &&
          props.membersTotalCount > 0 &&
          props.membersLinkedCount < props.membersTotalCount && (
            <div className="mt-4 text-xs text-orange-500 dark:text-orange-400 flex flex-col gap-0.5 border border-orange-500 dark:border-orange-400 rounded-md p-1 bg-orange-50 dark:bg-orange-950">
              <div className="flex items-center gap-1 font-medium">
                <Info className="size-3" />
                <p>
                  {props.membersLinkedCount} of {props.membersTotalCount} members linked
                </p>
              </div>
              <p>
                We might not be able to generate comprehensive summaries for all members. Go to
                settings to link remaining members.
              </p>
            </div>
          )}
      </div>

      <div className="flex items-end mt-auto">
        <div className="flex justify-between w-full items-center gap-2">
          {props.status === "connected" ||
          props.status === "connecting" ||
          props.status === "error" ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-2 rounded-full",
                    props.status === "connected"
                      ? "bg-green-500"
                      : props.status === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500",
                  )}
                ></div>
                <div className="text-sm text-muted-foreground">
                  {props.status === "connected"
                    ? "Connected"
                    : props.status === "connecting"
                      ? "Connecting..."
                      : "Error"}
                </div>
              </div>
              {props.status === "error" && (
                <IntegrationConnectButton name={props.name} connectLink={props.connectLink}>
                  Reconnect
                </IntegrationConnectButton>
              )}
              {props.status !== "error" && (
                <IntegrationSettingsDialog
                  isOpen={isOpen}
                  onOpenChange={setIsOpen}
                  name={props.name}
                  description={props.description}
                  icon={props.icon}
                  status={props.status}
                  connectLink={props.connectLink}
                  onDisconnect={props.onDisconnect}
                  onSettings={props.onSettings}
                >
                  {props.settingsChildren}
                </IntegrationSettingsDialog>
              )}
            </>
          ) : (
            <>
              <IntegrationSettingsDetailsDialog
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                name={props.name}
                description={props.description}
                icon={props.icon}
                status={props.status}
                connectLink={props.connectLink}
                onDisconnect={props.onDisconnect}
                onSettings={props.onSettings}
                onDetailsClick={
                  props.connectLink
                    ? undefined
                    : () => {
                        toast.info(<ToastIntegrationSuggestion name={props.name} />, {
                          id: `${props.name}-integration-suggestion-toast`,
                          position: "top-center",
                          icon: null,
                          duration: 10_000,
                        });
                      }
                }
              >
                {props.children}
              </IntegrationSettingsDetailsDialog>
              <IntegrationConnectButton name={props.name} connectLink={props.connectLink} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type IntegrationSettingsDetailsDialogProps = PropsWithChildren<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "connecting" | "disconnected" | "error";
  connectLink?: string;
  onDetailsClick?: () => void;
  onDisconnect?: () => void;
  onSettings: () => void;
}>;

export function IntegrationSettingsDetailsDialog(props: IntegrationSettingsDetailsDialogProps) {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (open && props.onDetailsClick) {
          props.onDetailsClick();
          return;
        }
        props.onOpenChange(open);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-sm:w-full max-sm:h-[calc(100vh-2rem)] max-sm:flex max-sm:flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <div className="size-3.5">{props.icon}</div>
              <div className="text-lg">{props.name}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-pretty text-left text-base">
            {props.description}
          </DialogDescription>
        </DialogHeader>

        <div className="h-full overflow-y-auto mt-2">{props.children}</div>

        <DialogFooter className="flex flex-row w-full items-center justify-between">
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Close
          </Button>

          <IntegrationConnectButton
            name={props.name}
            connectLink={props.connectLink}
            variant="default"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type IntegrationSettingsDialogProps = PropsWithChildren<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "connecting" | "disconnected" | "error";
  connectLink?: string;
  onDisconnect?: () => void;
  onSettings: () => void;
}>;

export function IntegrationSettingsDialog(props: IntegrationSettingsDialogProps) {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-sm:w-full max-sm:h-[calc(100vh-2rem)] max-sm:flex max-sm:flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <div className="size-3.5">{props.icon}</div>
              <div className="text-lg">{props.name}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-pretty text-left text-base">
            {props.description}
          </DialogDescription>
        </DialogHeader>

        <div className="h-full overflow-y-auto mt-2">{props.children}</div>

        <DialogFooter className="flex flex-row w-full items-center justify-between">
          {props.onDisconnect && (
            <Button
              variant="destructive"
              onClick={() => {
                props.onDisconnect?.();
                props.onOpenChange(false);
              }}
            >
              Disconnect
            </Button>
          )}

          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IntegrationSuggestionItem() {
  return (
    <div className="flex flex-col gap-4 border border-border rounded-lg p-3 min-h-[150px] h-full border-dashed">
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <div className="size-3.5">
            <PlusCircle className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-lg">Suggest an integration</div>
        </div>
        <div className="text-sm text-muted-foreground text-pretty">
          Can't find an integration you're looking for? Let us know which tools you'd like to see
          supported.
        </div>
      </div>

      <div className="flex items-end mt-auto">
        <div className="flex justify-between w-full items-center gap-2">
          <div />
          <Button variant="outline" size="sm" asChild>
            <a
              href="mailto:kacper@asyncstatus.com?subject=Integration Suggestion&body=I'd like to suggest adding support for: [Tool Name]%0A%0AUse case: [How you would use this integration]%0A%0AAdditional context: [Any other relevant information]"
              target="_blank"
              rel="noreferrer"
            >
              <Send className="size-3" />
              Suggest
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToastIntegrationSuggestion(props: { name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm flex items-center gap-2">
        <Info className="size-3" />
        {props.name} integration is not yet supported
      </p>
      <p className="text-sm text-muted-foreground text-pretty">
        Send us an email to prioritize it. We'll get back to you as soon as possible.
      </p>
      <Button
        className="mt-2"
        variant="secondary"
        size="sm"
        onClick={() => toast.dismiss(`${props.name}-integration-suggestion-toast`)}
      >
        Dismiss
      </Button>
      <Button size="sm" asChild>
        <a
          href="mailto:kacper@asyncstatus.com?subject=Integration Suggestion&body=I'd like to suggest adding support for: [Tool Name]%0A%0AUse case: [How you would use this integration]%0A%0AAdditional context: [Any other relevant information]"
          target="_blank"
          rel="noreferrer"
        >
          Send email
        </a>
      </Button>
    </div>
  );
}

function IntegrationConnectButton(
  props: PropsWithChildren<{
    name: string;
    connectLink?: string;
    variant?: "outline" | "default";
  }>,
) {
  if (!props.connectLink) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          toast.info(<ToastIntegrationSuggestion name={props.name} />, {
            id: `${props.name}-integration-suggestion-toast`,
            position: "top-center",
            icon: null,
            duration: 10_000,
          });
        }}
      >
        {props.children ?? "Connect"}
      </Button>
    );
  }

  return (
    <Button variant={props.variant ?? "outline"} size="sm" asChild>
      <a href={props.connectLink} target="_blank" rel="noreferrer">
        <ExternalLink className="size-3" />
        {props.children ?? "Connect"}
      </a>
    </Button>
  );
}
