"use server";

declare global {
  var serverCounter: number;
}

// TODO: Dynamically importing the action somehow gets duplicated module state in vite
globalThis.serverCounter = 0;

export async function getServerCounter(): Promise<number> {
  return serverCounter;
}

export async function changeServerCounter(formData: FormData): Promise<void> {
  const TEST_UPDATE = 1;
  serverCounter += Number(formData.get("change")) * TEST_UPDATE;
}

export async function resetServerCounter(): Promise<void> {
  serverCounter = 0;
}
