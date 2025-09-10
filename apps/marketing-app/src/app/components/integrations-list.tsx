import { 
  SiGithub, 
  SiSlack, 
  SiDiscord, 
  SiLinear, 
  SiJira, 
  SiAsana, 
  SiTrello, 
  SiClickup,
  SiNotion,
  SiFigma,
  SiZapier,
  SiGoogle,
  SiGitlab,
  NotSiMicrosoftTeams
} from "@asyncstatus/ui/brand-icons";
import { Code, Calendar, MessageSquare, Users, Zap, Globe } from "@asyncstatus/ui/icons";

export function IntegrationsList() {
  return (
    <div className="flex items-center justify-center gap-1 border border-primary rounded-full px-2 py-1 w-fit mx-auto max-sm:mt-8 mt-26">
    <p className="text-primary text-xs">Works across</p>
    <div className="flex items-center gap-1">
      <SiGithub className="size-3.5 text-primary" />
      <SiGitlab className="size-3.5 text-primary" />
      <SiSlack className="size-3.5 text-primary" />
      <SiDiscord className="size-3.5 text-primary" />
      <NotSiMicrosoftTeams className="size-3.5 fill-primary" />
      <SiLinear className="size-3.5 text-primary" />
      <SiFigma className="size-3.5 text-primary" />
    </div>
  </div>
  );
}