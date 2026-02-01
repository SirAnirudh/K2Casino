-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_game_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "betAmount" INTEGER NOT NULL DEFAULT 0,
    "targetScore" INTEGER NOT NULL DEFAULT 0,
    "timeTarget" INTEGER,
    "survivalTarget" INTEGER,
    "clicksTarget" INTEGER,
    "speed" TEXT NOT NULL DEFAULT 'NORMAL',
    "clicksUsed" INTEGER NOT NULL DEFAULT 0,
    "isDoubleOrNothing" BOOLEAN NOT NULL DEFAULT false,
    "payout" INTEGER NOT NULL DEFAULT 0,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_game_sessions" ("betAmount", "completedAt", "duration", "id", "payout", "score", "targetScore", "userId", "won") SELECT "betAmount", "completedAt", "duration", "id", "payout", "score", "targetScore", "userId", "won" FROM "game_sessions";
DROP TABLE "game_sessions";
ALTER TABLE "new_game_sessions" RENAME TO "game_sessions";
CREATE INDEX "game_sessions_userId_idx" ON "game_sessions"("userId");
CREATE INDEX "game_sessions_score_idx" ON "game_sessions"("score");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
