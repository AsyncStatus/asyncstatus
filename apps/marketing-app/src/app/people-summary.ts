interface PersonSummary {
  standupText: string;
  summary: string[];
  metricsText: string;
  meetingDetails: {
    time: string;
    peopleListening: number;
    peopleTyping: number;
  };
}

export const peopleSummary: Record<string, PersonSummary> = {
  "frontend-developer": {
    standupText: `Yeah, um, so I was mostly working through some UI stuff today. Not, like, a big change or anything, just there were a few things that felt off, and I wanted to clean them up before they became, you know, actual problems. The modal background wasn't really matching the rest of the interface it was subtle, but it kept catching my eye, like, every time I opened it, so I adjusted the color a bit. Spent a while checking contrast, testing in different states, that kind of thing. Probably overthought it, but I didn't want to just... push something and have it be wrong. There was also a label on the settings page that, um, didn't totally line up with what the setting actually did. So I rewrote it. It's more accurate now, I think. I had to dig around in the component logic just to be sure, and then one of the tests broke because it was looking for the old copy, so I fixed that too. I kept meaning to start on something else, but I didn't want to leave this half-fixed. It felt like it needed to be done first.`,
    summary: [
      "Tweaked modal background color and updated a settings label.",
      "Fixed a broken test caused by the label change.",
    ],
    metricsText:
      "We took 6 Slack messages, 4 GitHub commits and turned them into something you can actually read and use to make decisions. No meetings required.",
    meetingDetails: {
      time: "9:32 AM",
      peopleListening: 15,
      peopleTyping: 3,
    },
  },
  "backend-engineer": {
    standupText: `So, uh, I was mostly looking into that weird thing we saw in staging yesterday the 500 error that popped up once? I couldn't reproduce it locally, but I still went through the logs just in case. Nothing obvious stood out, but I added some extra logging around the handler to try and catch it next time. While I was in there, I noticed we were still logging full payloads in one spot, so I masked the email field just felt like something we should probably do. I didn't commit anything yet, just testing it out locally. I also checked the metrics dashboard for like a while to see if anything else was spiking, but it all looked stable. There was a timeout on one request earlier but I think that was just a fluke. Oh, and I opened the PR for that cleanup task from last week, finally it's just small stuff, a couple of naming things. I'll ask for a review tomorrow, probably. I was going to start on the new task but wanted to make sure the staging thing isn't going to flare up again first.`,
    summary: [
      "Added local logging to investigate a non-reproducible 500 error.",
      "Opened a small PR from last week's cleanup task.",
    ],
    metricsText:
      "We took 1 Slack message, 1 draft PR and turned them into something you can actually read and use to make decisions. No meetings required.",
    meetingDetails: {
      time: "9:47 AM",
      peopleListening: 12,
      peopleTyping: 4,
    },
  },
  "qa-engineer": {
    standupText: `So, uh, today I kind of circled back to some stuff from yesterday mostly the login flow again. I wasn't sure if the fix they pushed was fully working, so I ran through the test cases one more time just to double-check, even though they passed before. Everything was mostly fine, but I did notice that if you, like, enter a wrong email and tab out, it shows a kind of vague error? Not a huge deal, but I thought maybe it could be more specific. I flagged it in Slack, just to be safe. Then I looked at the password reset flow again, but I didn't have time to go through all the edge cases I did try the unconfirmed user scenario, and it seemed okay? I think. I was going to log a bug but wasn't sure if it was actually broken or just, like, slow. I also spent a bit of time on those flaky UI tests again one of them failed once but then passed, so I restarted the pipeline and it was fine. I didn't want to touch the helper code yet in case it's not actually the tests' fault. I kind of just kept an eye on things, made some notes, but yeah, I'm planning to dig deeper tomorrow when there's a bit more time.`,
    summary: [
      "Re-check of login and password reset flows.",
      "Flagged a non-critical error message in Slack.",
      "Monitored a flaky test.",
    ],
    metricsText:
      "We took 3 Slack messages and 0 GitHub commits and turned them into a clear update you didn't have to ask for.",
    meetingDetails: {
      time: "9:51 AM",
      peopleListening: 14,
      peopleTyping: 2,
    },
  },
};

export const fancyPeopleNames: Record<string, string> = {
  "frontend-developer": "frontend engineer",
  "backend-engineer": "backend engineer",
  "qa-engineer": "QA engineer",
};
