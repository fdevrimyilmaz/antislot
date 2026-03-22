export type DiaryCloudEntry = {
  id: string;
  date: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export type DiarySyncResult = {
  entries: DiaryCloudEntry[];
  serverTime: number;
  conflicts: number;
};

