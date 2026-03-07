export interface DailyQuote {
  text: string;
  author?: string;
}

export const DAILY_QUOTES: DailyQuote[] = [
  { text: "Every puzzle has a solution — patience reveals it." },
  { text: "Logic will get you from A to Z. Imagination will get you everywhere.", author: "Albert Einstein" },
  { text: "The more constraints one imposes, the more one frees oneself.", author: "Igor Stravinsky" },
  { text: "A good puzzle will be solved — a great puzzle changes how you think." },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Every empty cell is an invitation, not an obstacle." },
  { text: "Concentration is the root of all the higher abilities in man.", author: "Bruce Lee" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Nine numbers. Endless possibilities." },
  { text: "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.", author: "Joyce Meyer" },
  { text: "Think twice before you place, once is rarely enough." },
  { text: "The only way to learn mathematics is to do mathematics.", author: "Paul Halmos" },
  { text: "Each day is a new puzzle. Approach it fresh." },
  { text: "An expert is someone who has made all the mistakes which can be made in a narrow field.", author: "Niels Bohr" },
  { text: "The mind is not a vessel to be filled but a fire to be kindled.", author: "Plutarch" },
  { text: "One grid. One solution. One moment of clarity." },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The clearer the logic, the cleaner the solution." },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "A streak is a promise you made to yourself yesterday." },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "Logic is the anatomy of thought.", author: "John Locke" },
  { text: "Every master was once a beginner who refused to give up." },
  { text: "The brain is like a muscle — the more you use it, the stronger it gets." },
  { text: "What we know is a drop. What we don't know is an ocean.", author: "Isaac Newton" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "A puzzle a day keeps the fog away." },
  { text: "Focus on the process, not the prize." },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Your only limit is your mind." },
  { text: "The grid does not care about your mood — only your logic." },
  { text: "Genius is 1% inspiration and 99% perspiration.", author: "Thomas Edison" },
  { text: "Every number placed is a step closer to clarity." },
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Aristotle" },
  { text: "A good day starts with a clear mind and a fresh puzzle." },
  { text: "The difference between ordinary and extraordinary is that little extra." },
  { text: "Puzzles are the original mindfulness exercise." },
  { text: "Don't watch the clock. Do what it does — keep going.", author: "Sam Levenson" },
  { text: "One correct number at a time. That is all it takes." },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "Logic is not just a tool — it's a way of seeing the world." },
  { text: "Nothing in life is to be feared, only to be understood.", author: "Marie Curie" },
  { text: "Consistency is what transforms average into excellence." },
  { text: "Every row, column, and box — balance in all things." },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "The hardest puzzles teach the most important lessons." },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "When in doubt, eliminate. Clarity comes from what remains." },
  { text: "Your mind is your greatest asset. Sharpen it daily." },
  { text: "A solved puzzle is a small victory for the human mind." },
  { text: "Thinking is the hardest work there is, which is probably why so few engage in it.", author: "Henry Ford" },
  { text: "Every expert was once a beginner. Every pro started where you are now." },
  { text: "Reason is the natural order of truth.", author: "William Shakespeare" },
  { text: "The puzzle waits for no one — but it rewards those who show up." },
  { text: "To improve is to change; to be perfect is to change often.", author: "Winston Churchill" },
  { text: "Mathematics is the language in which God has written the universe.", author: "Galileo Galilei" },
  { text: "Nine boxes, nine rows, nine columns — harmony through constraint." },
  { text: "Life is a puzzle — the more pieces you fit, the clearer the picture becomes." },
  { text: "Mistakes are proof that you are trying." },
  { text: "Where there is logic, there is a path forward." },
  { text: "The secret to productivity is ruthless elimination of everything that doesn't matter." },
  { text: "Today's puzzle is a gift. Unwrap it carefully." },
  { text: "Understanding is the reward of patience." },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "The best time to solve a puzzle is now." },
  { text: "Numbers never lie — only our assumptions do." },
  { text: "One row at a time. One day at a time. One streak at a time." },
  { text: "Clarity is not something you find — it is something you create through focus." },
  { text: "A sharp mind is the greatest advantage you can carry." },
  { text: "Think deeply, place carefully, enjoy fully." },
];

/**
 * Returns today's quote using a deterministic date-based index.
 * Same quote all day, same quote across all devices.
 */
export function getDailyQuote(): DailyQuote {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const seed = now.getFullYear() * 1000 + dayOfYear;
  const index = seed % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
