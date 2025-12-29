-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'OTROS',
    "creadorId" INTEGER NOT NULL,
    CONSTRAINT "Ticket_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("actualizadoEn", "creadoEn", "creadorId", "descripcion", "estado", "id", "prioridad", "titulo") SELECT "actualizadoEn", "creadoEn", "creadorId", "descripcion", "estado", "id", "prioridad", "titulo" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
