// Minimal ambient types for Bun's test runner.
//
// The full @types/bun package is deliberately NOT listed in tsconfig "types":
// its global `fetch` typing conflicts with the auto-generated files under
// src/integrations/supabase, which the app must not edit. Declaring only the
// test-runner API keeps `import { describe, it } from "bun:test"` typechecked
// without changing any app-facing globals.
declare module "bun:test" {
  type TestFn = () => void | Promise<void>;

  interface TestApi {
    (name: string, fn: TestFn, timeoutMs?: number): void;
    skip(name: string, fn?: TestFn): void;
    only(name: string, fn?: TestFn): void;
    todo(name: string): void;
  }

  export const describe: TestApi;
  export const it: TestApi;
  export const test: TestApi;
  export const beforeAll: (fn: TestFn) => void;
  export const beforeEach: (fn: TestFn) => void;
  export const afterAll: (fn: TestFn) => void;
  export const afterEach: (fn: TestFn) => void;
}
