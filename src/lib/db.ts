import Dexie, { Table } from "dexie";

export type SpreadMode = "single" | "two_page";

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;

  spreadMode: SpreadMode;
  pageFormat: "A5" | "A6" | "TN" | "Letter";
  gutterSide: "left" | "right";

  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type Scrap = {
  id: string;
  entryId: string;
  type: "text" | "link";
  text?: string;
  url?: string;
  createdAt: string;
};

export type SpreadPlan = {
  id: string;
  entryId: string;
  planJson: unknown;
  createdAt: string;
};

class JJDB extends Dexie {
  entries!: Table<Entry, string>;
  scraps!: Table<Scrap, string>;
  spreads!: Table<SpreadPlan, string>;

  constructor() {
    super("junk_journal_db");
    this.version(1).stores({
      entries: "id, date, updatedAt",
      scraps: "id, entryId, type, createdAt",
      spreads: "id, entryId, createdAt"
    });
  }
}

export const db = new JJDB();
