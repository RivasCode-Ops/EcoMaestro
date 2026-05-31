#!/usr/bin/env node
import { buildRagIndex } from '../lib/rag-store.mjs';

const r = await buildRagIndex();
console.log('RAG index:', r.chunk_count, 'chunks →', r.path);
