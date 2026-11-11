// Pending cloud writes from every mounted useCloudState, so logout can flush them while
// the session is still valid. Kept separate so AuthContext and useCloudState don't import each other.
const pendingFlushes = new Set<() => Promise<void>>();

export function registerFlush(flush: () => Promise<void>) {
  pendingFlushes.add(flush);
  return () => {
    pendingFlushes.delete(flush);
  };
}

export async function flushCloudWrites() {
  await Promise.all([...pendingFlushes].map(flush => flush()));
}
