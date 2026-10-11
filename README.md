# Jeopardy Gamer

Multiplayer Jeopardy for a living-room host and phones.

## Run it

```bash
cd jeopardy
node server.js
```

Open http://localhost:3000 on the host computer. Players on the same Wi‑Fi open that address (use your computer’s local IP, e.g. http://192.168.x.x:3000).

No npm packages required — plain Node.js.

## How to play

1. Host enters a name and clicks **I’m the Host**. Share the 5-letter code.
2. Everyone else enters their name + code and joins.
3. Host starts the game and picks clues on the board.
4. Only the host sees the clue text. Players see category + value and must listen.
5. Buzzers open the instant a square is selected. First **BUZZ** locks the others.
6. Wrong answers reopen buzzers for everyone else.
7. Daily Doubles are random (1 in Jeopardy, 2 in Double Jeopardy). Host sees a tiny “DD” on the board. That player wagers, then answers.
8. When the first board is clear (or host skips ahead), values double.
9. Final Jeopardy: category is shown, players wager, host reads the clue aloud, players type answers, host judges.

Clues are pub-trivia obscure — not school facts, not impossible.
