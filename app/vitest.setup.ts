import { vi } from 'vitest';

vi.mock('#imports', () => ({
  useFetch: vi.fn(() =>
    Promise.resolve({ data: { message: 'mocked response' } })
  ),
  useRouter: () => ({
    push: vi.fn()
  }),
  useRuntimeConfig: () => ({
    public: {
      apiBase: 'https://mock-api.com'
    }
  }),
  navigateTo: vi.fn()
}));

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $someGlobalPlugin: vi.fn()
  })
}));

vi.mock('#imports', () => ({
  useState: vi.fn((key, defaultValue) => {
    const state = new Map();
    if (!state.has(key)) state.set(key, defaultValue());
    return state.get(key);
  })
}));
