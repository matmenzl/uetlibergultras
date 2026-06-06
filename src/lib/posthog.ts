import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  const key =
    (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ||
    "phc_oZFrazSQSTzYQT6Sc9Hm7i487PDAiNTvexnibSDoPdsh";
  const host =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
    "https://eu.i.posthog.com";

  if (!key) {
    // No key configured — analytics disabled, no-op.
    return;
  }

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    persistence: "localStorage+cookie",
    respect_dnt: true,
    ip: false,
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.debug(false);
      }
    },
  });

  initialized = true;
}

function enabled() {
  return initialized && !!import.meta.env.VITE_POSTHOG_KEY;
}

export function track(
  event: string,
  props?: Record<string, unknown>
) {
  if (!enabled()) return;
  try {
    posthog.capture(event, props);
  } catch (err) {
    console.warn("[posthog] capture failed", err);
  }
}

export function identifyUser(
  userId: string,
  props?: Record<string, unknown>
) {
  if (!enabled()) return;
  try {
    posthog.identify(userId, props);
  } catch (err) {
    console.warn("[posthog] identify failed", err);
  }
}

export function resetUser() {
  if (!enabled()) return;
  try {
    posthog.reset();
  } catch (err) {
    console.warn("[posthog] reset failed", err);
  }
}

export { posthog };