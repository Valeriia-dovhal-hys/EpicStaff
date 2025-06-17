// // mock-embedding-config.service.ts
// import { Injectable } from '@angular/core';
// import { Observable, of } from 'rxjs';
// import { MockEmbeddingConfig } from './mock_embedding_config.model';

// @Injectable({
//   providedIn: 'root',
// })
// export class MockEmbeddingConfigService {
//   private embeddingConfigs: MockEmbeddingConfig[] = [
//     {
//       id: 1,
//       custom_name: 'Embedding Config for text-embedding-3-small',
//       temperature: 0.7,
//       context: 30,
//       activated: true,
//       embedding_model: 1,
//     },
//     {
//       id: 2,
//       custom_name: 'Embedding Config for text-embedding-ada-002',
//       temperature: 0.8,
//       context: 20,
//       activated: false,
//       embedding_model: 2,
//     },
//   ];

//   constructor() {}

//   public getEmbeddingConfigs(): Observable<MockEmbeddingConfig[]> {
//     return of(this.embeddingConfigs);
//   }
// }
