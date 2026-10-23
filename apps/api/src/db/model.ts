import mongoose from "mongoose";

export interface ModelLike<T extends { id?: string }> {
  create(doc: Partial<T>): Promise<T>;
  find(query?: Record<string, unknown>): QueryLike<T>;
  findById(id: string): Promise<T | null>;
  findOne(query: Record<string, unknown>): Promise<T | null>;
  findOneAndUpdate(
    query: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: { new?: boolean },
  ): Promise<T | null>;
  updateMany(
    query: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<{ modifiedCount: number; matchedCount: number }>;
  deleteMany(query: Record<string, unknown>): Promise<{ deletedCount: number }>;
  countDocuments(query?: Record<string, unknown>): Promise<number>;
}

export interface QueryLike<T> {
  sort(spec: Record<string, 1 | -1>): QueryLike<T>;
  limit(n: number): QueryLike<T>;
  skip(n: number): QueryLike<T>;
  select(spec: Record<string, 0 | 1>): QueryLike<T>;
  lean(): QueryLike<T>;
  exec(): Promise<T[]>;
}

function matchValue(actual: unknown, expected: unknown): boolean {
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    const obj = expected as Record<string, unknown>;
    if ("$in" in obj && Array.isArray(obj.$in)) {
      return obj.$in.map(String).includes(String(actual));
    }
    if ("$ne" in obj) return String(actual) !== String(obj.$ne);
    if ("$exists" in obj) return (actual !== undefined) === Boolean(obj.$exists);
    return false;
  }
  if (Array.isArray(expected)) {
    return expected.map(String).includes(String(actual));
  }
  if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();
  }
  return String(actual) === String(expected);
}

function matches(doc: Record<string, unknown>, query: Record<string, unknown>): boolean {
  return Object.entries(query ?? {}).every(([key, expected]) => {
    if (key === "$or") {
      const clauses = expected as Record<string, unknown>[];
      return clauses.some((clause) => matches(doc, clause));
    }
    const value = key.split(".").reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      doc,
    );
    return matchValue(value, expected);
  });
}

/** Applies a mongo-style update document to a plain object, dotted paths included. */
export function applyUpdate(
  doc: Record<string, unknown>,
  update: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...doc };
  const isPlainObject = (item: unknown): item is Record<string, unknown> =>
    Boolean(item) &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    (item as { constructor?: unknown }).constructor === Object;
  const set = (update.$set as Record<string, unknown>) ?? update;
  Object.entries(set).forEach(([path, value]) => {
    if (path.startsWith("$")) return;
    const parts = path.split(".");
    let target = result;
    parts.slice(0, -1).forEach((part) => {
      if (typeof target[part] !== "object" || target[part] === null) target[part] = {};
      target = target[part] as Record<string, unknown>;
    });
    const last = parts[parts.length - 1];
    if (isPlainObject(value) && isPlainObject(target[last])) {
      target[last] = { ...(target[last] as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      // Dates, primitives and arrays are stored as-is - spreading a Date
      // would silently turn it into `{}`, losing the timestamp.
      target[last] = value;
    }
  });
  return result;
}

/**
 * Minimal in-memory document store used when MongoDB is not reachable. It
 * implements the small subset of the Mongoose API that NexClass relies on so
 * the whole product stays runnable without local infrastructure.
 */
export function createMemoryModel<T extends { id?: string }>(
  name: string,
  defaults: () => Partial<T> = () => ({}),
): ModelLike<T> {
  const rows = new Map<string, T>();
  let counter = 0;

  const build = (input: Partial<T>): T => {
    const doc = {
      ...defaults(),
      ...input,
    } as T & { id: string };
    doc.id = doc.id ?? `${name}_${Date.now().toString(36)}_${(counter += 1)}`;
    return doc;
  };

  const normalize = (query: Record<string, unknown> = {}) => {
    const out: Record<string, unknown> = {};
    Object.entries(query).forEach(([key, value]) => {
      out[key === "_id" ? "id" : key] = value;
    });
    return out;
  };

  const runQuery = (query: Record<string, unknown> = {}) => {
    let result = [...rows.values()].filter((row) =>
      matches(row as unknown as Record<string, unknown>, query),
    );
    return result;
  };

  return {
    async create(doc: Partial<T>) {
      const built = build(doc);
      rows.set(built.id as string, built);
      return built;
    },
    find(query: Record<string, unknown> = {}) {
      let items = runQuery(normalize(query));
      const q: QueryLike<T> = {
        sort(spec) {
          items = [...items].sort((a, b) => {
            for (const [key, dir] of Object.entries(spec)) {
              const av = (a as unknown as Record<string, unknown>)[key];
              const bv = (b as unknown as Record<string, unknown>)[key];
              if (av === bv) continue;
              const cmp = av! > bv! ? 1 : -1;
              return dir === 1 ? cmp : -cmp;
            }
            return 0;
          });
          return q;
        },
        limit(n: number) {
          items = items.slice(0, n);
          return q;
        },
        skip(n: number) {
          items = items.slice(n);
          return q;
        },
        select() {
          return q;
        },
        lean() {
          return q;
        },
        async exec() {
          return items;
        },
      };
      return q;
    },
    async findById(id: string) {
      return rows.get(id) ?? null;
    },
    async findOne(query: Record<string, unknown>) {
      const found = runQuery(normalize(query))[0];
      return found ?? null;
    },
    async findOneAndUpdate(
      query: Record<string, unknown>,
      update: Record<string, unknown>,
      options?: { new?: boolean },
    ) {
      const found = runQuery(normalize(query))[0];
      if (!found) return null;
      const merged = applyUpdate(found as unknown as Record<string, unknown>, update);
      const updated = build(merged as Partial<T>);
      rows.set(updated.id as string, updated);
      return options?.new === false ? found : updated;
    },
    async updateMany(query: Record<string, unknown>, update: Record<string, unknown>) {
      const matched = runQuery(normalize(query));
      matched.forEach((row) => {
        const merged = applyUpdate(row as unknown as Record<string, unknown>, update);
        const updated = build(merged as Partial<T>);
        rows.set(updated.id as string, updated);
      });
      return { modifiedCount: matched.length, matchedCount: matched.length };
    },
    async deleteMany(query: Record<string, unknown>) {
      const matched = runQuery(normalize(query));
      matched.forEach((row) => rows.delete(row.id as string));
      return { deletedCount: matched.length };
    },
    async countDocuments(query: Record<string, unknown> = {}) {
      return runQuery(normalize(query)).length;
    },
  };
}

const registry = new Map<string, ModelLike<never>>();

/**
 * Structural shape of a Mongoose model instance that we rely on. Declared
 * locally (instead of using mongoose's generic Model<T>/Schema<T> types) to
 * keep the type checker's instantiation depth bounded.
 */
interface MongoModelShaped<T> {
  create(doc: unknown): Promise<unknown>;
  find(query?: unknown): {
    sort(spec: unknown): unknown;
    limit(n: number): unknown;
    skip(n: number): unknown;
    select(spec: unknown): unknown;
    lean(): unknown;
    exec(): Promise<unknown[]>;
  };
  findById(id: string): { exec(): Promise<unknown> };
  findOne(query: unknown): { exec(): Promise<unknown> };
  findOneAndUpdate(query: unknown, update: unknown, options?: unknown): { exec(): Promise<unknown> };
  updateMany(query: unknown, update: unknown): Promise<unknown>;
  deleteMany(query: unknown): Promise<unknown>;
  countDocuments(query?: unknown): Promise<number>;
}

export function registerModel<T extends { id?: string }>(
  name: string,
  mongooseSchema: unknown,
  defaults: () => Partial<T> = () => ({}),
): ModelLike<T> {
  if (mongoose.connection.readyState === 1) {
    // Kept structural on purpose: instantiating mongoose's generic Model<T>
    // types here blows up the type-checker's instantiation depth.
    const raw = ((mongoose.models as Record<string, unknown>)[name] ??
      (mongoose.model as unknown as (model: string, schema: unknown) => unknown)(
        name,
        mongooseSchema,
      )) as unknown as MongoModelShaped<T>;
    const toMongoQuery = (query: Record<string, unknown> = {}) => {
      const out: Record<string, unknown> = {};
      Object.entries(query).forEach(([key, value]) => {
        out[key === "id" ? "_id" : key] = value;
      });
      return out;
    };
    const wrapped: ModelLike<T> = {
      create: async (doc) => (await raw.create(doc)) as T,
      find: (query = {}) => {
        const q = raw.find(toMongoQuery(query));
        const adapt = (): QueryLike<T> => {
          const base: QueryLike<T> = {
            sort: (spec) => {
              q.sort(spec);
              return adapt();
            },
            limit: (n) => {
              q.limit(n);
              return adapt();
            },
            skip: (n) => {
              q.skip(n);
              return adapt();
            },
            select: (spec) => {
              q.select(spec);
              return adapt();
            },
            lean: () => {
              q.lean();
              return adapt();
            },
            exec: async () => (await q.exec()) as T[],
          };
          return base;
        };
        return adapt();
      },
      findById: async (id) => (await raw.findById(id).exec()) as T | null,
      findOne: async (query) => (await raw.findOne(toMongoQuery(query)).exec()) as T | null,
      findOneAndUpdate: async (query, update, options) =>
        (await raw.findOneAndUpdate(toMongoQuery(query), update, options ?? {}).exec()) as T | null,
      updateMany: async (query, update) => {
        const result = (await raw.updateMany(toMongoQuery(query), update)) as {
          modifiedCount?: number;
          matchedCount?: number;
        };
        return {
          modifiedCount: result.modifiedCount ?? 0,
          matchedCount: result.matchedCount ?? 0,
        };
      },
      deleteMany: async (query) => {
        const result = (await raw.deleteMany(toMongoQuery(query))) as { deletedCount?: number };
        return { deletedCount: result.deletedCount ?? 0 };
      },
      countDocuments: (query = {}) => raw.countDocuments(toMongoQuery(query)),
    };
    registry.set(name, wrapped as unknown as ModelLike<never>);
    return wrapped;
  }
  const memory = createMemoryModel<T>(name, defaults);
  registry.set(name, memory as unknown as ModelLike<never>);
  return memory;
}

/** Used by tests and by the in-memory fallback to clear state between cases. */
export function resetRegistry() {
  registry.clear();
}

