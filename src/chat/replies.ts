import { sessionRandom } from "../profiles/session";
import type { Profile } from "../profiles/types";

// Simulated messages from the demo profiles. Picked by turn so a chat feels like a real start:
// greeting → getting to know each other → small talk. Fixed per profile for the session.

const OPENERS = [
  "Hey {me}! Thanks for the like 😊",
  "Hi {me}! Your profile made me smile 😄",
  "Hello! I was hoping we’d match 🙌",
  "Hey there! How’s your day going?",
];

const GREETING_REPLIES = [
  "Hey {me}! 😊 So nice to hear from you. How’s your week going?",
  "Hi! Thanks for the message 😄 What made you swipe right?",
  "Hello {me}! I was hoping you’d write first 🙈 How are you?",
  "Hey! Good to match with you. What are you up to today?",
];

const ANSWERS = [
  "Good question! I’d say {interest}, I could talk about it for hours 😄",
  "Honestly? A quiet weekend and good food. What about you?",
  "Haha I’ve been asked that before 😅 Mostly {interest} and spending time with friends.",
  "I’m a {job}, it keeps me busy but I love it. And you?",
  "Mmm let me think… {interest}! You?",
];

const SMALL_TALK = [
  "That’s so interesting! Tell me more 😊",
  "Haha I love that 😂",
  "Same here! We already have something in common 🙌",
  "Oh nice, I’ve always wanted to try that.",
  "You seem really easy to talk to 😊",
  "What does a perfect weekend look like for you?",
  "I’m in {city} too, have you been to any good places lately?",
  "Okay that made me laugh 😄",
];

function fill(text: string, p: Profile, myName?: string) {
  return text
    .replace("{me}", myName || "there")
    .replace("{interest}", (p.interests[0] ?? "travel").toLowerCase())
    .replace("{job}", (p.profession || "designer").toLowerCase())
    .replace("{city}", p.city);
}

function pick(list: string[], p: Profile, key: string) {
  return list[Math.floor(sessionRandom(`${p.id}:${key}`) * list.length)];
}

// Does this match write first? About half of them, a few seconds after matching.
export function writesFirst(p: Profile) {
  return sessionRandom(`${p.id}:opener`) < 0.5;
}

export function openerFor(p: Profile, myName?: string) {
  return fill(pick(OPENERS, p, "opener-text"), p, myName);
}

// Their reply number `turn` (0 = first reply) to the tester's last message.
export function replyFor(
  p: Profile,
  turn: number,
  lastText: string,
  myName?: string,
) {
  if (turn === 0) return fill(pick(GREETING_REPLIES, p, "greet"), p, myName);
  if (lastText.includes("?"))
    return fill(pick(ANSWERS, p, `answer-${turn}`), p, myName);
  return fill(pick(SMALL_TALK, p, `talk-${turn}`), p, myName);
}

const MEDIA_REPLIES = {
  photo: [
    "Wow, nice photo! 😍",
    "Haha I love this 😄",
    "Where was that taken?",
    "Great shot! You have good taste 📸",
  ],
  video: [
    "Haha that’s so fun 😂",
    "Cool video! Where is that?",
    "I watched it twice 😄",
    "Love the vibe of this 🙌",
  ],
  audio: [
    "Haha I love your voice 😊",
    "Aww that’s sweet, thank you 🥰",
    "Voice notes are the best 😄",
    "You sound nice! 😊",
  ],
};

// Their reply to a photo / video / voice message you sent.
export function mediaReplyFor(
  p: Profile,
  kind: "photo" | "video" | "audio",
  turn: number,
) {
  return pick(MEDIA_REPLIES[kind], p, `media-${kind}-${turn}`);
}

// How long they "type" before the reply appears (ms).
export function typingTime(text: string) {
  return Math.min(4200, 1200 + text.length * 35);
}
