import fs from 'fs';
import path from 'path';
import {
  AiUsageLog,
  Trip,
  User,
  VerifiedPlace,
} from '../types.ts';
import {
  createSeedTrips,
  SEED_AI_LOGS,
  SEED_USERS,
  SEED_VERIFIED_PLACES,
} from './templates.ts';

export interface DatabaseSchema {
  users: User[];
  trips: Trip[];
  verifiedPlaces: VerifiedPlace[];
  aiLogs: AiUsageLog[];
  aiCache: Record<string, { value: any; cachedAt: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'smart_trip_planner_db.json');

class PersistentDatabase {
  private state: DatabaseSchema;

  constructor() {
    this.state = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (
          parsed &&
          Array.isArray(parsed.users) &&
          Array.isArray(parsed.trips) &&
          parsed.trips.length > 0
        ) {
          return {
            users: parsed.users,
            trips: parsed.trips,
            verifiedPlaces:
              parsed.verifiedPlaces || [...SEED_VERIFIED_PLACES],
            aiLogs: parsed.aiLogs || [...SEED_AI_LOGS],
            aiCache: parsed.aiCache || {},
          };
        }
      }
    } catch (err) {
      console.error('Database load warning, initializing fresh seed:', err);
    }

    const initial: DatabaseSchema = {
      users: [...SEED_USERS],
      trips: createSeedTrips(),
      verifiedPlaces: [...SEED_VERIFIED_PLACES],
      aiLogs: [...SEED_AI_LOGS],
      aiCache: {},
    };
    this.save(initial);
    return initial;
  }

  private save(nextState: DatabaseSchema = this.state): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(nextState, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE_PATH);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // Users
  public getUsers(): User[] {
    return this.state.users;
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  public createUser(user: User): User {
    this.state.users.push(user);
    this.save();
    return user;
  }

  public toggleUserBlock(userId: string, isBlocked: boolean): User | undefined {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return undefined;
    user.isBlocked = isBlocked;
    this.save();
    return user;
  }

  // Trips
  public getTrips(): Trip[] {
    return this.state.trips;
  }

  public getTripById(id: string): Trip | undefined {
    return this.state.trips.find((t) => t.id === id);
  }

  public getTripByInviteCode(inviteCode: string): Trip | undefined {
    const code = inviteCode.trim().toUpperCase();
    return this.state.trips.find((t) => t.inviteCode.toUpperCase() === code);
  }

  public saveTrip(trip: Trip): Trip {
    const idx = this.state.trips.findIndex((t) => t.id === trip.id);
    trip.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.state.trips[idx] = trip;
    } else {
      this.state.trips.unshift(trip);
    }
    this.save();
    return trip;
  }

  public deleteTrip(tripId: string): boolean {
    const prevLen = this.state.trips.length;
    this.state.trips = this.state.trips.filter((t) => t.id !== tripId);
    if (this.state.trips.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Verified Places
  public getVerifiedPlaces(): VerifiedPlace[] {
    return this.state.verifiedPlaces;
  }

  public addVerifiedPlace(place: VerifiedPlace): VerifiedPlace {
    this.state.verifiedPlaces.unshift(place);
    this.save();
    return place;
  }

  public deleteVerifiedPlace(id: string): boolean {
    const prevLen = this.state.verifiedPlaces.length;
    this.state.verifiedPlaces = this.state.verifiedPlaces.filter(
      (p) => p.id !== id
    );
    if (this.state.verifiedPlaces.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // AI Usage Logs & Cache
  public getAiLogs(): AiUsageLog[] {
    return this.state.aiLogs;
  }

  public addAiLog(log: AiUsageLog): AiUsageLog {
    this.state.aiLogs.unshift(log);
    if (this.state.aiLogs.length > 250) {
      this.state.aiLogs = this.state.aiLogs.slice(0, 250);
    }
    this.save();
    return log;
  }

  public getCachedResponse<T>(key: string): T | null {
    const entry = this.state.aiCache[key];
    if (!entry) return null;
    return entry.value as T;
  }

  public setCachedResponse(key: string, value: any): void {
    this.state.aiCache[key] = {
      value,
      cachedAt: new Date().toISOString(),
    };
    this.save();
  }
}

export const db = new PersistentDatabase();
