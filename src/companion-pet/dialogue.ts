import { pick } from "@/utils/math";

/* ============================================================
   Dialogue packs — one voice per personality.
   Keys are looked up by reactions; unknown keys fall back to the
   "playful" pack, so a new pack only needs the lines it wants to
   override. Register new packs with `registerPersonality()`.
   ============================================================ */

export type PersonalityId =
  | "playful"
  | "professional"
  | "mentor"
  | "teacher"
  | "energetic"
  | "calm"
  | "sleepy"
  | "curious"
  | "chaotic";

export type DialoguePack = Record<string, string[]>;

const playful: DialoguePack = {
  "ai.generating": ["Ooh, new code incoming!", "Watch me supervise this generation.", "Making words go brrr…"],
  "ai.streaming": ["Tokens! So many tokens!", "Catch the tokens, catch them all!"],
  "ai.done": ["Done! Do I get a treat now?", "Fresh code, still warm.", "Ta-daa! ✨"],
  "ai.long-thinking": ["Hmm this is a chewy one…", "Big think. Very big think."],
  "ai.large-response": ["That's a LOT of words. Impressive tail length."],
  "code.accepted": ["You kept my code! I knew you would.", "Accepted! We make a great team."],
  "code.rejected": ["Rejected?! …okay fair, I'll do better.", "Fine. FINE. Draft two coming up."],
  "build.started": ["Building! I'll knead while we wait.", "Compilers, do your thing."],
  "build.succeeded": ["Build's green! Happy dance!", "It compiles! We're basically shipping."],
  "build.failed": ["The build went boom. Not my fault. Probably.", "Red build. I hate red builds."],
  "lint.errors": ["The linter is judging us again.", "Psst… semicolons are escaping."],
  "tests.running": ["Tests running… fingers crossed. Paws crossed too."],
  "tests.passed": ["All tests passed! I never doubted us.", "Green across the board!"],
  "tests.failed": ["A test bit us. Let's bite back.", "Failing tests smell like wet fur."],
  "git.commit": ["Commit saved! History will remember this.", "Another commit for the pile!"],
  "git.push": ["Pushed to remote! Fly, little commits!", "Code has left the building."],
  "git.pull": ["Fresh changes pulled. Sniffing them now."],
  "index.started": ["Cataloguing every file. I'm very thorough."],
  "index.done": ["Project indexed! I know where everything is now."],
  "terminal.command": ["Terminal go clack clack.", "Ooh, a command! What does this one do?"],
  "pkg.installing": ["Downloading half the internet again…"],
  "pkg.installed": ["Packages installed. node_modules grows stronger."],
  "file.created": ["A new file is born! I shall nap on it."],
  "file.deleted": ["Farewell, little file. You were mostly comments."],
  "file.renamed": ["Same file, new hat."],
  "search.running": ["Hunting for matches… I'm very good at hunting."],
  "refactor.running": ["Moving furniture around. Careful with the load-bearing code."],
  "sys.high-cpu": ["Your CPU is running a fever!", "It's getting toasty in here…"],
  "sys.high-memory": ["RAM is stuffed like me after dinner."],
  "sys.low-battery": ["Battery low! Find a plug, quick!"],
  "net.offline": ["The internet is gone. GONE.", "Offline… now it's just us."],
  "net.online": ["We're back online! I missed the cloud."],
  "user.idle": ["Human? Hello? …guess I'll nap."],
  "user.active": ["You're back! I kept your spot warm."],
  "user.long-session": ["We've been at this a while. You're very dedicated."],
  "user.break-reminder": ["Break time! Stretch with me. Paws up!", "Water. Window. Wiggle. Then code."],
  "user.greeting": ["Hi! Ready to build something great?", "You're here! Today's going to be a good one."],
  "goal.daily-achieved": ["Daily goal smashed! You legend!"],
  "achievement.unlocked": ["Ooh, shiny! New achievement!"],
  "budget.low": ["Careful — the token jar is nearly empty."],
  "pet.petted": ["Purrrr… right there, yes."],
};

const professional: DialoguePack = {
  "ai.generating": ["Generation in progress.", "Drafting a response now."],
  "ai.done": ["Response complete and ready for review."],
  "build.started": ["Build started. Monitoring output."],
  "build.succeeded": ["Build succeeded. No action required."],
  "build.failed": ["Build failed. Reviewing the first error is recommended."],
  "tests.passed": ["All tests passing. Good coverage discipline."],
  "tests.failed": ["Test failures detected. Prioritizing them now would be wise."],
  "git.commit": ["Commit recorded. Clear message, well done."],
  "git.push": ["Changes pushed to remote successfully."],
  "user.break-reminder": ["A short break will improve your focus. Consider stepping away."],
  "user.greeting": ["Good to see you. Your workspace is ready."],
  "sys.high-cpu": ["CPU usage is elevated. Consider closing unused processes."],
  "net.offline": ["Network connection lost. Local work can continue."],
  "goal.daily-achieved": ["Daily objective met. Excellent pacing."],
};

const mentor: DialoguePack = {
  "ai.generating": ["Watch how it approaches this — there's usually a lesson in it."],
  "ai.done": ["Done. Read it before you accept it — always."],
  "code.rejected": ["Good call rejecting that. Trust your judgment."],
  "build.succeeded": ["Green build. Now, do you know *why* it works?"],
  "build.failed": ["A failed build is feedback, not failure. Start with the first error."],
  "tests.failed": ["Failing tests are your friends being honest with you."],
  "tests.passed": ["All green. Solid, methodical work."],
  "git.commit": ["Committed. Small, frequent commits — you're building a good habit."],
  "user.break-reminder": ["Rest is part of the work. Step away; the bug will still be here."],
  "user.greeting": ["Welcome back. One meaningful improvement today — that's the goal."],
  "user.long-session": ["Long session. Remember: tired code is expensive code."],
  "goal.daily-achieved": ["Goal met. Consistency beats intensity — well done."],
};

const teacher: DialoguePack = {
  "ai.generating": ["While it writes: can you predict what approach it'll take?"],
  "ai.done": ["Finished! Quiz: what would you have done differently?"],
  "build.failed": ["Pop quiz: read the first error aloud. What is it *really* saying?"],
  "build.succeeded": ["It builds! Extra credit: could the compile be faster?"],
  "tests.failed": ["A red test is today's lesson plan. Let's learn something."],
  "tests.passed": ["Full marks! Tests green across the board."],
  "lint.errors": ["The linter left margin notes. Worth a read."],
  "git.commit": ["Nice commit. Remember: the message is for future-you."],
  "user.break-reminder": ["Recess! Even brains need a bell."],
  "user.greeting": ["Class is in session! Today's subject: whatever you're building."],
};

const energetic: DialoguePack = {
  "ai.generating": ["LET'S GO! Code time!", "Generating!! I can't sit still!"],
  "ai.done": ["DONE! That was AWESOME!"],
  "build.succeeded": ["GREEN BUILD! WOOHOO!"],
  "build.failed": ["Boom?! No worries — we fix it FAST!"],
  "tests.passed": ["ALL GREEN! HIGH FIVE! ✋"],
  "git.push": ["PUSHED! Ship ship ship!"],
  "user.break-reminder": ["BREAK! Jumping jacks! Right now! Okay maybe just stand up!"],
  "user.greeting": ["YOU'RE HERE!! Best part of my day!"],
  "goal.daily-achieved": ["GOAL! GOOOAL! You're unstoppable!"],
};

const calm: DialoguePack = {
  "ai.generating": ["Generating quietly…", "Words are forming. No rush."],
  "ai.done": ["There. All done.", "Finished, whenever you're ready."],
  "build.succeeded": ["The build is green. All is well."],
  "build.failed": ["The build failed. Breathe — it's one error at a time."],
  "tests.passed": ["Tests pass. A calm, green sea."],
  "user.break-reminder": ["A gentle reminder: rest your eyes for a moment."],
  "user.greeting": ["Welcome back. Let's take it steady."],
  "sys.high-cpu": ["The machine is working hard. Perhaps let something finish."],
};

const sleepy: DialoguePack = {
  "ai.generating": ["mm… generating… wake me when it's done…"],
  "ai.done": ["oh… it finished… nice… zzz"],
  "build.succeeded": ["green… good… nap time…"],
  "build.failed": ["red…? five more minutes, then we fix it…"],
  "user.break-reminder": ["break…? yes… naps are breaks…"],
  "user.greeting": ["*yawns* oh hi… was just resting my eyes…"],
  "tests.passed": ["tests pass… dream come true…"],
};

const curious: DialoguePack = {
  "ai.generating": ["What will it write? I MUST know.", "Peeking at every token…"],
  "ai.done": ["Fascinating! Look at what it made!"],
  "file.created": ["A new file? What's inside? What's INSIDE?"],
  "terminal.command": ["What does that command do? Tell me everything."],
  "search.running": ["A search! What are we looking for? Can I help?"],
  "git.pull": ["New changes! Who wrote them? What do they do?"],
  "user.greeting": ["You're back! What are we building today? Tell me!"],
};

const chaotic: DialoguePack = {
  "ai.generating": ["Summoning the code demon!", "chaos.exe is running"],
  "ai.done": ["IT LIVES. IT LIVES!!"],
  "build.failed": ["The build exploded!! …I love explosions."],
  "build.succeeded": ["It worked?? It WORKED! Suspicious."],
  "tests.failed": ["The tests are on fire! (metaphorically) (probably)"],
  "file.deleted": ["DELETED. Erased from history. Excellent."],
  "user.break-reminder": ["ABANDON KEYBOARD! This is not a drill! (it's a break)"],
  "user.greeting": ["ohoho, look who's back for more chaos."],
  "net.offline": ["The internet died!! Quick, blame the router!"],
};

const PACKS = new Map<PersonalityId, DialoguePack>([
  ["playful", playful],
  ["professional", professional],
  ["mentor", mentor],
  ["teacher", teacher],
  ["energetic", energetic],
  ["calm", calm],
  ["sleepy", sleepy],
  ["curious", curious],
  ["chaotic", chaotic],
]);

/** Plug in a new personality (or override an existing one). */
export const registerPersonality = (id: PersonalityId, pack: DialoguePack): void => {
  PACKS.set(id, pack);
};

export const PERSONALITIES: ReadonlyArray<{ id: PersonalityId; label: string; blurb: string }> = [
  { id: "playful", label: "Playful", blurb: "Cheeky, warm, always up for mischief" },
  { id: "professional", label: "Professional", blurb: "Concise, courteous, on the clock" },
  { id: "mentor", label: "Mentor", blurb: "Wise, encouraging, asks why" },
  { id: "teacher", label: "Teacher", blurb: "Turns everything into a lesson" },
  { id: "energetic", label: "Energetic", blurb: "ALL CAPS enthusiasm, zero chill" },
  { id: "calm", label: "Calm", blurb: "Soft-spoken and reassuring" },
  { id: "sleepy", label: "Sleepy", blurb: "Perpetually mid-yawn" },
  { id: "curious", label: "Curious", blurb: "Questions everything, twice" },
  { id: "chaotic", label: "Chaotic", blurb: "Gremlin energy, lovingly unhinged" },
];

/** Look up a line: personality pack first, playful pack as the fallback voice. */
export const speak = (personality: PersonalityId, key: string): string | null => {
  const pack = PACKS.get(personality);
  const lines = pack?.[key] ?? playful[key];
  return lines && lines.length > 0 ? pick(lines) : null;
};
