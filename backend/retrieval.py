"""
retrieval.py
-------------
Retrieval helpers shared by every RAG endpoint.

Two problems with plain vector search on lecture notes:
  1. Exact technical terms ("Porter stemmer", "TF-IDF", "Apriori") are often
     ranked below chunks that are only loosely "about" the topic.
  2. Mind maps / revision notes were built from 6-8 chunks picked by a vague
     query, so most of a unit never reached the model and it filled the gaps
     from its own knowledge.

This module fixes both:
  * hybrid_search() fuses vector similarity with BM25 keyword ranking
    (Reciprocal Rank Fusion) inside the requested unit.
  * unit_digest() returns the unit's own text in page order, so generators
    read the whole unit (sampled evenly if it is very long).
"""

import math
import re
from collections import Counter
from typing import Dict, List, Optional, Tuple

from langchain_core.documents import Document

_STOPWORDS = set(
    """a an the and or of to in on for with by is are was were be been being it its this that these those
    as at from into about over under what which who whom whose why how when where explain define describe
    give list state write discuss short note notes example examples me please tell difference between
    do does did can could should would will shall may might i you we they he she them their our your
    unit topic topics question answer simple simply words word""".split()
)

# (faculty dir, unit) -> (collection size, chunks, bm25 index). Rebuilt when the collection size changes.
_chunk_cache: Dict[Tuple[str, Optional[int]], Tuple[int, List[Document], "_BM25"]] = {}


def _tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-z0-9]+(?:[-'][a-z0-9]+)*", text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 1]


class _BM25:
    def __init__(self, docs: List[List[str]], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.docs = [Counter(d) for d in docs]
        self.lengths = [len(d) for d in docs]
        self.avgdl = (sum(self.lengths) / len(self.lengths)) if self.lengths else 0.0
        df = Counter()
        for d in self.docs:
            df.update(d.keys())
        n = len(self.docs)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def scores(self, query: List[str]) -> List[float]:
        out = []
        for tf, dl in zip(self.docs, self.lengths):
            s = 0.0
            for t in query:
                if t not in tf:
                    continue
                f = tf[t]
                s += self.idf.get(t, 0.0) * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * dl / (self.avgdl or 1)))
            out.append(s)
        return out


def _collection_size(store) -> int:
    try:
        return store._collection.count()
    except Exception:
        return -1


def _load(store, unit_number: Optional[int]) -> Tuple[List[Document], "_BM25"]:
    key = (getattr(store, "_persist_directory", "") or str(id(store)), unit_number)
    size = _collection_size(store)
    cached = _chunk_cache.get(key)
    if cached and cached[0] == size:
        return cached[1], cached[2]

    where = {"unit": int(unit_number)} if unit_number is not None else None
    raw = store.get(where=where, include=["documents", "metadatas"]) if where else store.get(include=["documents", "metadatas"])
    docs = [
        Document(page_content=text or "", metadata=meta or {})
        for text, meta in zip(raw.get("documents", []), raw.get("metadatas", []))
    ]
    docs.sort(key=lambda d: (str(d.metadata.get("source_file", "")), int(d.metadata.get("page", 0) or 0)))
    bm25 = _BM25([_tokenize(d.page_content) for d in docs])
    _chunk_cache[key] = (size, docs, bm25)
    return docs, bm25


def get_unit_chunks(store, unit_number: Optional[int] = None) -> List[Document]:
    """All chunks of a unit (or of the whole store), ordered by source file and page."""
    return _load(store, unit_number)[0]


def hybrid_search(
    store,
    query: str,
    unit_number: Optional[int] = None,
    k: int = 6,
    fetch_k: int = 12,
) -> Tuple[List[Document], float]:
    """
    Vector + BM25 retrieval fused with Reciprocal Rank Fusion.
    Returns (documents, top vector relevance score). The vector score is kept so
    callers can apply the out-of-syllabus guardrail exactly as before.
    """
    where = {"unit": int(unit_number)} if unit_number is not None else None
    vector_hits = store.similarity_search_with_relevance_scores(query, k=fetch_k, filter=where)
    top_score = float(vector_hits[0][1]) if vector_hits else 0.0

    chunks, bm25 = _load(store, unit_number)
    q_tokens = _tokenize(query)
    keyword_ranked: List[Document] = []
    if q_tokens and chunks:
        scored = sorted(zip(bm25.scores(q_tokens), range(len(chunks))), reverse=True)
        keyword_ranked = [chunks[i] for s, i in scored[:fetch_k] if s > 0]

    def key_of(d: Document):
        return (d.metadata.get("source_file"), d.metadata.get("page"), d.page_content[:80])

    fused: Dict[tuple, float] = {}
    by_key: Dict[tuple, Document] = {}
    RRF_K = 60
    for rank, (doc, _score) in enumerate(vector_hits):
        kk = key_of(doc)
        by_key[kk] = doc
        fused[kk] = fused.get(kk, 0.0) + 1.0 / (RRF_K + rank)
    for rank, doc in enumerate(keyword_ranked):
        kk = key_of(doc)
        by_key.setdefault(kk, doc)
        fused[kk] = fused.get(kk, 0.0) + 1.0 / (RRF_K + rank)

    ranked = sorted(fused.items(), key=lambda kv: kv[1], reverse=True)
    return [by_key[kk] for kk, _ in ranked[:k]], top_score


def format_sources(docs: List[Document]) -> str:
    """Numbered context block the LLM can cite: [1] file, page N."""
    parts = []
    for i, d in enumerate(docs, 1):
        page = int(d.metadata.get("page", 0) or 0) + 1
        parts.append(f"[{i}] {d.metadata.get('source_file', 'Notes')}, page {page}\n{d.page_content.strip()}")
    return "\n\n".join(parts)


def unit_digest(store, unit_number: int, max_chars: int = 30000) -> str:
    """
    The unit's own text in page order, tagged with page numbers. If the unit is
    longer than max_chars, chunks are sampled evenly across the whole unit
    (not just the start) so every section is represented.
    """
    chunks = get_unit_chunks(store, unit_number)
    if not chunks:
        return ""
    total = sum(len(c.page_content) for c in chunks)
    if total > max_chars:
        keep = max(1, int(len(chunks) * max_chars / total))
        stride = len(chunks) / keep
        chunks = [chunks[int(i * stride)] for i in range(keep)]
    parts, used = [], 0
    for c in chunks:
        page = int(c.metadata.get("page", 0) or 0) + 1
        block = f"[p.{page}] {c.page_content.strip()}"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
    return "\n\n".join(parts)


def clear_cache():
    _chunk_cache.clear()
