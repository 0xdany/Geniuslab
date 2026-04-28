"use client";

import { openDB } from "idb";
import type { IDBPDatabase } from "idb";

let dbPromise: Promise<IDBPDatabase> | null = null;

export type PendingRecording = {
  id: string;
  attemptId: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  maxDurationSeconds: number | null;
  maxAttempts: number;
  attemptNumber: number;
  mimeType: string;
  durationSeconds?: number;
  uploaded?: boolean;
  createdAt: number;
  updatedAt: number;
};

function getRecordingDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser context.");
  }
  dbPromise ??= openDB("geniuslab-recordings", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("chunks")) {
        db.createObjectStore("chunks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { keyPath: "id" });
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

export async function savePendingRecording(recording: Omit<PendingRecording, "id" | "createdAt" | "updatedAt">) {
  const db = await getRecordingDb();
  const now = Date.now();
  const existing = await db.get("pending", recording.attemptId) as PendingRecording | undefined;
  const value: PendingRecording = {
    ...existing,
    ...recording,
    id: recording.attemptId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.put("pending", value);
  return value;
}

export async function listPendingRecordings() {
  const db = await getRecordingDb();
  const all = await db.getAll("pending") as PendingRecording[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getPendingRecording(attemptId: string) {
  const db = await getRecordingDb();
  return db.get("pending", attemptId) as Promise<PendingRecording | undefined>;
}

export async function clearPendingRecording(attemptId: string) {
  const db = await getRecordingDb();
  await db.delete("pending", attemptId);
}

export function useUploadQueue() {
  return {
    saveRecordingChunk,
    loadRecordingChunks,
    clearRecordingChunks,
    savePendingRecording,
    listPendingRecordings,
    getPendingRecording,
    clearPendingRecording,
  };
}
