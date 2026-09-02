import { AssetMetadata } from './LibraryService';

export class AssetSelectionService {
  /**
   * Handles keyboard navigation through a list of assets relative to a current selection.
   * Returns the new selected asset ID or null if unchanged.
   */
  static navigate(
    assets: AssetMetadata[],
    currentSelectedId: string | null,
    direction: 'next' | 'prev' | 'first' | 'last'
  ): string | null {
    if (assets.length === 0) return null;

    if (direction === 'first') return assets[0].id;
    if (direction === 'last') return assets[assets.length - 1].id;

    if (!currentSelectedId) {
      return assets[0].id;
    }

    const index = assets.findIndex(item => item.id === currentSelectedId);
    if (index === -1) return assets[0].id;

    if (direction === 'next') {
      const nextIndex = Math.min(index + 1, assets.length - 1);
      return assets[nextIndex].id;
    } else {
      const prevIndex = Math.max(index - 1, 0);
      return assets[prevIndex].id;
    }
  }

  /**
   * Checks if an asset is currently selected.
   */
  static isSelected(currentSelectedId: string | null, assetId: string): boolean {
    return currentSelectedId === assetId;
  }
}
