import { BlocklistStorage } from './storage/blocklist-storage';
import { PatternsStorage } from './storage/patterns-storage';
import { BlocklistEntry, BlocklistPattern } from './types';

/**
 * Backward-compatible facade that delegates all data access to storage classes.
 */
export class BlocklistManager {
  private readonly blocklistStorage: BlocklistStorage;
  private readonly patternsStorage: PatternsStorage;

  constructor(
    blocklistStorage: BlocklistStorage = new BlocklistStorage(),
    patternsStorage: PatternsStorage = new PatternsStorage()
  ) {
    this.blocklistStorage = blocklistStorage;
    this.patternsStorage = patternsStorage;
  }

  async initialize(): Promise<void> {
    await this.blocklistStorage.initialize();
    await this.patternsStorage.initialize();
  }

  async loadBlocklist(): Promise<void> {
    await this.blocklistStorage.load();
  }

  async loadPatterns(): Promise<void> {
    await this.patternsStorage.load();
  }

  /**
   * Kept for compatibility. Storage methods already persist updates.
   */
  async saveBlocklist(): Promise<void> {
    const current = await this.blocklistStorage.load();
    await this.blocklistStorage.save(current);
  }

  async getBlocklist(): Promise<BlocklistEntry[]> {
    const data = await this.blocklistStorage.load();
    return [...data.entries];
  }

  async getPatterns(): Promise<BlocklistPattern[]> {
    const data = await this.patternsStorage.load();
    return [...data.patterns];
  }

  async getLastUpdated(): Promise<number> {
    const metadata = await this.blocklistStorage.getMetadata();
    return metadata.updatedAt;
  }

  async addDomain(
    domain: string,
    reason: string,
    customPatterns?: BlocklistPattern[]
  ): Promise<void> {
    await this.blocklistStorage.addDomain(domain, reason, customPatterns);
  }
}
