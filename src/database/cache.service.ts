import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Collection, Connection } from 'mongoose';

// Keys under these prefixes are real data (guest carts/wishlists), not cache, so they
// are persisted in MongoDB and survive restarts and deploys. Everything else lives in memory.
const PERSISTENT_PREFIXES = ['guest:'];
const MAX_MEMORY_ENTRIES = 5000;

interface Entry {
  value: string;
  expiresAt: number;
}

interface StoredEntry {
  _id: string;
  value: string;
  expiresAt: Date | null;
}

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, Entry>();
  private readonly store: Collection<StoredEntry>;

  constructor(@InjectConnection() connection: Connection) {
    this.store = connection.collection<StoredEntry>('cache_entries');
  }

  async onModuleInit() {
    await this.store.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    this.logger.log('Cache ready (memory + MongoDB for persistent keys)');
  }

  async get(key: string): Promise<string | null> {
    if (this.isPersistent(key)) {
      const doc = await this.store.findOne({ _id: key });
      return doc && (!doc.expiresAt || doc.expiresAt.getTime() > Date.now()) ? doc.value : null;
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : Infinity;
    if (this.isPersistent(key)) {
      await this.store.updateOne(
        { _id: key },
        { $set: { value, expiresAt: Number.isFinite(expiresAt) ? new Date(expiresAt) : null } },
        { upsert: true },
      );
      return;
    }
    this.memory.delete(key);
    this.memory.set(key, { value, expiresAt });
    if (this.memory.size > MAX_MEMORY_ENTRIES) {
      this.memory.delete(this.memory.keys().next().value);
    }
  }

  async del(key: string): Promise<void> {
    if (this.isPersistent(key)) await this.store.deleteOne({ _id: key });
    else this.memory.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = this.globToRegex(pattern);
    const persisted = await this.store.find({ _id: { $regex: regex } }, { projection: { _id: 1 } }).toArray();
    return [...[...this.memory.keys()].filter((k) => regex.test(k)), ...persisted.map((d) => d._id)];
  }

  async deleteByPattern(...patterns: string[]): Promise<number> {
    let deleted = 0;
    for (const pattern of patterns) {
      const regex = this.globToRegex(pattern);
      for (const key of this.memory.keys()) {
        if (regex.test(key)) {
          this.memory.delete(key);
          deleted++;
        }
      }
      deleted += (await this.store.deleteMany({ _id: { $regex: regex } })).deletedCount;
    }
    return deleted;
  }

  private isPersistent(key: string): boolean {
    return PERSISTENT_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  }
}
