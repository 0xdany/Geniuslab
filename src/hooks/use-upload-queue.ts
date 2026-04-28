"use client";

import { openDB } from "idb";
import type { IDBPDatabase } from "idb";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getRecordingDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser context.");
  }
  dbPromise ??= openDB("geniuslab-recordings", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("chunks")) {
        db.createObjectStore("chunks", { keyPath: "id" });
      }
    },
  });
  return dbPromise;
}

export async function saveRecordingChunk(attemptId: string, index: number, chunk: Blob) {
  const db = await getRecordingDb();
  await db.put("chunks", { id: `${attemptId}:${index}`, attemptId, index, chunk, createdAt: Date.now() });
}

export async function loadRecordingChunks(attemptId: string) {
  const db = await getRecordingDb();
  const all = (await db.getAll("chunks")) as Array<{ attemptId: string; index: number; chunk: Blob }>;
  return all.filter((item) => item.attemptId === attemptId).sort((a, b) => a.index - b.index).map((item) => item.chunk);
}

export async function clearRecordingChunks(attemptId: string) {
  const db = await getRecordingDb();
  const keys = await db.getAllKeys("chunks");
  await Promise.all(keys.filter((key) => String(key).startsWith(`${attemptId}:`)).map((key) => db.delete("chunks", key)));
}

export function useUploadQueue() {
  return { saveRecordingChunk, loadRecordingChunks, clearRecordingChunks };
}
