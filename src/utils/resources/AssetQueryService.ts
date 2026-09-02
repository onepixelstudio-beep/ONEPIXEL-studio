import { AssetMetadata } from './LibraryService';

export type SortCriteria = 'createdAtDesc' | 'createdAtAsc' | 'updatedAtDesc' | 'updatedAtAsc' | 'nameAsc' | 'nameDesc' | 'sizeDesc' | 'sizeAsc' | 'typeAsc';

export interface QueryOptions {
  searchQuery?: string;
  categoryFilter?: string; // 'all', 'stamp', 'pattern', etc.
  tagFilter?: string | null;
  sortBy?: SortCriteria;
}

export class AssetQueryService {
  /**
   * Filters and sorts a list of assets based on query options.
   */
  static query(assets: AssetMetadata[], options: QueryOptions): AssetMetadata[] {
    let result = [...assets];
    const { searchQuery, categoryFilter, tagFilter, sortBy = 'createdAtDesc' } = options;

    // 1. Search Query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.description || '').toLowerCase().includes(query) ||
        (item.type || 'stamp').toLowerCase().includes(query) ||
        item.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // 2. Category/Type Filter
    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter(item => (item.type || 'stamp') === categoryFilter);
    }

    // 3. Tag Filter
    if (tagFilter) {
      const cleanTag = tagFilter.toLowerCase().trim();
      result = result.filter(item => 
        item.tags.map(t => t.toLowerCase().trim()).includes(cleanTag)
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'createdAtDesc': return b.createdAt - a.createdAt;
        case 'createdAtAsc': return a.createdAt - b.createdAt;
        case 'updatedAtDesc': return b.updatedAt - a.updatedAt;
        case 'updatedAtAsc': return a.updatedAt - b.updatedAt;
        case 'nameAsc': return a.name.localeCompare(b.name);
        case 'nameDesc': return b.name.localeCompare(a.name);
        case 'sizeDesc': return (b.width * b.height) - (a.width * a.height);
        case 'sizeAsc': return (a.width * a.height) - (b.width * b.height);
        case 'typeAsc': return (a.type || 'stamp').localeCompare(b.type || 'stamp');
        default: return b.createdAt - a.createdAt;
      }
    });

    return result;
  }

  /**
   * Extracts a list of unique tags with their frequencies from the asset list.
   */
  static getUniqueTags(assets: AssetMetadata[]): { tag: string; count: number }[] {
    const counts: Record<string, number> = {};
    assets.forEach(item => {
      item.tags.forEach(t => {
        const tag = t.trim().toLowerCase();
        if (tag) counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([tag, count]) => ({ tag, count }));
  }

  /**
   * Counts assets by type.
   */
  static getTypeCounts(assets: AssetMetadata[]): Record<string, number> {
    const counts: Record<string, number> = { all: assets.length };
    assets.forEach(item => {
      const type = item.type || 'stamp';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }
}
