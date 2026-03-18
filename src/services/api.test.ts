
/* ─── normalizeStatus ────────────────────────────────────────────────────────── */
// La función no se exporta directamente; testeamos el comportamiento público
// a través de la forma en que getTasks normaliza el campo status.
// Aquí testeamos la lógica pura mediante un mock de fetch.

describe('getTasks — normalización de status', () => {
  const makeRawTask = (status: unknown) => ({
    id: '1',
    title: 'T',
    description: null,
    status,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockFetch = (tasks: unknown[]) => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: tasks }),
    });
  };

  it('conserva status válido "pending"', async () => {
    mockFetch([makeRawTask('pending')]);
    const { getTasks } = await import('./api');
    const result = await getTasks();
    expect(result[0].status).toBe('pending');
  });

  it('conserva status válido "progress"', async () => {
    mockFetch([makeRawTask('progress')]);
    const { getTasks } = await import('./api');
    const result = await getTasks();
    expect(result[0].status).toBe('progress');
  });

  it('conserva status válido "completed"', async () => {
    mockFetch([makeRawTask('completed')]);
    const { getTasks } = await import('./api');
    const result = await getTasks();
    expect(result[0].status).toBe('completed');
  });

  it('normaliza status nulo a "pending"', async () => {
    mockFetch([makeRawTask(null)]);
    const { getTasks } = await import('./api');
    const result = await getTasks();
    expect(result[0].status).toBe('pending');
  });

  it('normaliza status inválido ("100") a "pending"', async () => {
    mockFetch([makeRawTask('100')]);
    const { getTasks } = await import('./api');
    const result = await getTasks();
    expect(result[0].status).toBe('pending');
  });
});
