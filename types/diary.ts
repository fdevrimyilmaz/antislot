export type DiarySyncEntry = {
  id: string;
  date: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export type DiarySyncRequest = {
  entries: DiarySyncEntry[];
  lastSyncAt: number;
};

export type DiarySyncResponse = {
  ok: boolean;
  entries: DiarySyncEntry[];
  serverTime: number;
  conflicts: number;
};

