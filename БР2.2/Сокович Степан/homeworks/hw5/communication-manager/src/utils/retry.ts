export async function retry<T>(fn: () => Promise<T>, times = 40, delayMs = 1500): Promise<T> {
  let last: unknown;
  for (let i = 0; i < times; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw last;
}
