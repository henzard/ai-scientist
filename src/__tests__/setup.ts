import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// ─── Framer Motion mock ───────────────────────────────────────────────────────
// jsdom has no layout engine — framer-motion crashes without this mock.

const STRIPPED_PROPS = new Set([
  'initial', 'animate', 'exit', 'whileHover', 'whileTap',
  'transition', 'variants', 'layout', 'layoutId',
]);

function makeMotionComponent(tag: string) {
  return React.forwardRef(function MotionComponent(
    { children, ...props }: Record<string, unknown>,
    ref: React.Ref<unknown>
  ) {
    const clean: Record<string, unknown> = { ref };
    for (const [k, v] of Object.entries(props)) {
      if (!STRIPPED_PROPS.has(k)) clean[k] = v;
    }
    return React.createElement(tag, clean, children as React.ReactNode);
  });
}

vi.mock('framer-motion', () => {
  const motion = new Proxy({} as Record<string, unknown>, {
    get: (_, tag: string) => makeMotionComponent(tag),
  });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useMotionValue: (v: unknown) => ({ get: () => v, set: vi.fn() }),
    useTransform: () => ({ get: vi.fn() }),
  };
});
