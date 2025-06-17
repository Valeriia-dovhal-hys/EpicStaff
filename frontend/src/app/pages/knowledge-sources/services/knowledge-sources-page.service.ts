import { Injectable, computed, signal } from '@angular/core';
import { EmbeddingConfig } from '../../../shared/models/embedding-config.model';
import { SourceCollection } from '../models/source-collection.model';
import { Source } from '../models/source.model';

@Injectable({
  providedIn: 'root',
})
export class KnowledgeSourcesPageService {
  // Signals for collections
  private _collections = signal<SourceCollection[]>([]);
  private _selectedCollection = signal<SourceCollection | null>(null);
  private _selectedEmbeddingConfig = signal<EmbeddingConfig | null>(null);

  // Signals for sources/files
  private _allSources = signal<Source[]>([]);

  // Computed signal for filtered sources based on selected collection
  private _filteredSources = computed(() => {
    const currentCollection = this._selectedCollection();
    const allSources = this._allSources();

    if (!currentCollection) {
      return [];
    }

    return allSources.filter(
      (source) => source.source_collection === currentCollection.collection_id
    );
  });

  // Loading state signal
  private _isLoaded = signal<boolean>(false);

  constructor() {}

  // Collections getters
  public get collections() {
    return this._collections;
  }

  public get selectedCollection() {
    return this._selectedCollection;
  }

  public get selectedEmbeddingConfig() {
    return this._selectedEmbeddingConfig;
  }

  // Sources getters
  public get allSources() {
    return this._allSources;
  }

  public get filteredSources() {
    return this._filteredSources;
  }

  // Loading state getter
  public get isLoaded() {
    return this._isLoaded;
  }

  // Set loading state
  public setLoaded(isLoaded: boolean): void {
    this._isLoaded.set(isLoaded);
  }

  // Setters for collections
  public setCollections(collections: SourceCollection[]): void {
    this._collections.set(collections);
  }

  public setSelectedCollection(collection: SourceCollection | null): void {
    this._selectedCollection.set(collection);
    // No need to manually filter sources, the computed signal handles it
  }

  public setSelectedEmbeddingConfig(config: EmbeddingConfig | null): void {
    this._selectedEmbeddingConfig.set(config);
  }

  // Setters for sources
  public setAllSources(sources: Source[]): void {
    this._allSources.set(sources);
    // No need to manually filter sources, the computed signal handles it
  }

  // Methods for managing collections
  public addCollection(collection: SourceCollection): void {
    this._collections.update((current) => [...current, collection]);
  }

  public updateCollection(
    collectionId: number,
    updates: Partial<SourceCollection>
  ): void {
    this._collections.update((current) =>
      current.map((collection) =>
        collection.collection_id === collectionId
          ? { ...collection, ...updates }
          : collection
      )
    );

    // Also update selectedCollection if it's the one being updated
    const selected: SourceCollection | null = this._selectedCollection();
    if (selected && selected.collection_id === collectionId) {
      this._selectedCollection.set({ ...selected, ...updates });
    }
  }

  public removeCollection(collectionId: number): void {
    this._collections.update((current) =>
      current.filter((collection) => collection.collection_id !== collectionId)
    );

    // If the deleted collection was selected, select another one or set to null
    const selected = this._selectedCollection();
    if (selected && selected.collection_id === collectionId) {
      const remainingCollections = this._collections();
      this.setSelectedCollection(
        remainingCollections.length > 0 ? remainingCollections[0] : null
      );
    }
  }

  public removeSource(sourceId: number): void {
    this._allSources.update((current) =>
      current.filter((source) => source.document_id !== sourceId)
    );
    // No need to manually update filtered sources, the computed signal handles it
  }
}
