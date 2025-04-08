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
    standupText: `Yeah, um, so I was mostly working through some UI stuff today. Not, like, a big change or anything, just there were a few things that felt off, and I wanted to clean them up before they became, you know, actual problems. The modal background wasn't really matching the rest of the interface it was subtle, but it kept catching my eye, like, every time I opened it, so I adjusted the color a bit. Spent a while checking contrast, testing in different states, that kind of thing. Probably overthought it, but I didn't want to just... push something like have it be wrong. There was also a label on the settings page that, um, didn't totally line up with what the setting actually did. So I rewrote it. It's more accurate now, I think. I had to dig around in the component logic just to be sure, and then one of the tests broke because it was looking for the old copy, so I fixed that too. I kept meaning to start on something else, but I didn't want to leave this half-fixed. It felt like it needed to be done first. 
    
    And then, uh, there was this thing with the animations that I noticed yesterday? They were kind of, um, janky on Safari, especially when you... when you open multiple modals in a row. Something about the backdrop filter, I think. I spent maybe an hour trying different approaches, like, first I thought it was a z-index issue, but that wasn't it. Then I was thinking maybe we need to, um, adjust the timing function? But that didn't really help either. I eventually found this blog post that mentioned some Safari-specific quirk with backdrop blur and opacity transitions happening at the same time. So I separated those into two different steps and that seemed to fix it. I mean, I think it fixed it? It's hard to be 100% sure because I don't have access to all the Safari versions to test on. I asked Jenny if she could check it on her iPad but she hasn't gotten back to me yet.
    
    Oh, and I also started looking at that accessibility ticket about, um, keyboard navigation in the dropdown menus? I didn't make any changes yet, just researching approaches. I found this really helpful article about ARIA attributes and focus management that I think will help, but honestly, I'm not super confident about the best way to implement it. Should we be using a library for this? Or just handle it ourselves? I'm kinda torn between, you know, adding another dependency versus potentially getting something wrong in our custom implementation. Maybe I'll ask in the frontend channel later to see what others think? Anyway, that's kinda where I'm at today. Sorry if that was too much detail, I wasn't sure how specific to be.`,
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
    standupText: `Yeah, I've been, um, mostly looking into that weird thing we saw in staging yesterday the 500 error that popped up once? I couldn't reproduce it locally, but I still went through the logs just in case. Nothing obvious stood out, but I added some extra logging around the handler to try and catch it next time. While I was in there, I noticed we were still logging full payloads in one spot, so I masked the email field just felt like something we should probably do. I didn't commit anything yet, just testing it out locally. I also checked the metrics dashboard for like a while to see if anything else was spiking, but it all looked stable. There was a timeout on one request earlier but I think that was just a fluke. Oh, and I opened the PR for that cleanup task from last week, finally it's just small stuff, a couple of naming things. I'll ask for a review tomorrow, probably. I was going to start on the new task but wanted to make sure the staging thing isn't going to flare up again first.
    
    And, um, I also spent some time, probably too much time honestly, looking at our database query performance. I noticed that one of our API endpoints was getting slower and slower as we add more users. I ran some, uh, what do you call them... explain plans? Yeah, explain plans on the queries, and found that we're missing an index on the user preferences table. So when we do that lookup for the notification settings, it's doing a full table scan which is, you know, not great. I added the index locally and the query time went from like 800ms down to like 12ms, which is pretty significant, I think. I'm not 100% sure if this might affect some other parts of the system though, so I want to test it a bit more thoroughly before pushing it up.
    
    Oh yeah, and I also had this weird issue where my local environment kept crashing yesterday evening when I was trying to work on that, um, that thing with the payment service integration? I think something's wrong with my Docker setup, or maybe the memory allocation? It works fine for like 20 minutes and then just dies with some cryptic message about, uh, I think it was like "insufficient resources" or something? I didn't get very far with debugging it. I tried increasing the memory limit in the Docker settings, but it didn't seem to help. Maybe I need to completely rebuild my containers? I dunno. Anyway, that kinda blocked me from making progress on the payment service stuff, which is annoying because that's supposedly high priority. I'll probably ask Carlos for help since he set up most of the Docker stuff originally.`,
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
    standupText: `So, uh, today I kind of circled back to some stuff from yesterday mostly the login flow again. I wasn't sure if the fix they pushed was fully working, so I ran through the test cases one more time just to double-check, even though they passed before. Everything was mostly fine, but I did notice that if you, like, enter a wrong email and tab out, it shows a kind of vague error? Not a huge deal, but I thought maybe it could be more specific. I flagged it in Slack, just to be safe. Then I looked at the password reset flow again, but I didn't have time to go through all the edge cases I did try the unconfirmed user scenario, and it seemed okay? I think. I was going to log a bug but wasn't sure if it was actually broken or just, like, slow. I also spent a bit of time on those flaky UI tests again one of them failed once but then passed, so I restarted the pipeline and it was fine. I didn't want to touch the helper code yet in case it's not actually the tests' fault. I kind of just kept an eye on things, made some notes, but yeah, I'm planning to dig deeper tomorrow when there's a bit more time.
    
    I also, um, started looking at that new feature that was merged yesterday? The team calendar integration thing? I was trying to follow the test plan that was in the PR description, but honestly it was pretty vague and I wasn't really sure what I was supposed to be checking for specifically. So I just kinda went through it like a user would, you know? Clicking around, trying different inputs. I found this weird edge case where if you have a meeting with no title, it shows up as "undefined" in the calendar view, which doesn't look great. And then there's this other thing where if you have like, um, overlapping meetings, the UI gets all wonky and some of the text gets cut off. I'm not sure if that's a priority to fix before release, but I took some screenshots and will add them to the ticket later.
    
    And then, uh, oh yeah, I meant to mention that I've been having trouble with the automated mobile tests. They've been super unreliable lately, like, they'll pass on my machine but then fail in the CI pipeline. Or sometimes they fail in different ways each time I run them. I think it might be something to do with the, what's it called, the device farm setup? Or maybe the way we're handling, like, async operations in the test code? I'm not really sure, to be honest. I spoke with Dave about it yesterday, and he suggested we might need to add more wait times or something, but that feels like a band-aid solution, not fixing the root cause. I might pair with someone from the mobile team tomorrow to try and figure out what's going on. It's getting to the point where we're ignoring the test results because they're so flaky, which kind of defeats the purpose of having automated tests in the first place, right? Anyway, that's... that's pretty much it from my side.`,
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
