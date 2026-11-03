# Chapter 6: Retrieval-Augmented Generation

**Summary**: *A RAG pipeline is two systems: an offline indexer that decides what a chunk is and how it can be found, and an online retriever that decides which chunks reach the prompt. Most RAG questions come down to whether the retriever was built for this data and these queries. The answer is usually in the retrieval layer, not in the model.*

## Retrieval is chosen after the simpler options have been ruled out

Before designing chunking and indexes, the architect asks whether retrieval is needed at all. Anthropic's Contextual Retrieval article gives the baseline: if a knowledge base is **smaller than about 200,000 tokens (roughly 500 pages)**, you can put all of it in the prompt and skip RAG. Prompt caching makes repeated use of that large prefix cheaper and faster.<sup>[1]</sup> RAG is the answer once the corpus outgrows the prompt, changes faster than you want to re-send it, or needs per-user filtering.

Two later facts make the choice harder than "does it fit?":

- Many current models have a **1M-token context window**, and on Claude 4.6 and later models (except Claude Haiku 5.5) the whole window is billed at **standard per-token rates**. On Claude Haiku 5.5, a prompt over **100,000 tokens** pays higher prices for the whole request.<sup>[2][3]</sup>
- More context is not free in quality. The context-windows page warns that accuracy and recall degrade as token count grows (**context rot**). Curating what goes in matters as much as how much fits.<sup>[2]</sup>

So "it fits in 1M tokens" does not settle the question. A 600,000-token policy library sent on every request is billed on every request (at cache-read rates if cached), and it competes for the model's attention. A retriever that sends 20 relevant chunks is usually cheaper per query and often more accurate. The long-context option wins when the corpus is small, stable, and most questions need much of it at once.

### Options ranked by constraint

| Dominant constraint | Usually wins | Why |
|---|---|---|
| Small, stable corpus (well under the window), answers draw on many parts at once | **Whole corpus in the prompt, cached** | No retrieval misses at all, and caching removes most of the repeated cost<sup>[1]</sup> |
| Large or growing corpus, each question needs a few passages | **Hybrid RAG with reranking** | Scales past the window and sends only what the query needs<sup>[1]</sup> |
| Rows, tables, metrics, exact aggregates | **Query the data with a tool or code execution** | Similarity search cannot sum a column. Pasting the table in performs badly too (see below)<sup>[4]</sup> |
| Facts that change hourly or live outside your systems | **Live lookup: a tool against the source, or web search** | An index is only as fresh as its last rebuild<sup>[5][6]</sup> |
| Agent exploring a codebase or file tree | **Just-in-time retrieval (glob, grep, targeted reads)**, optionally with some context loaded up front | Avoids stale indexes and keeps only what is needed in context<sup>[5]</sup> |

## Chunking and indexing decide what can ever be found

*The decision*: what one chunk is, what text is indexed for it, and which indexes exist.

The standard pipeline from Anthropic's article: split the corpus into chunks of **usually no more than a few hundred tokens**, embed each chunk, store the vectors, and at query time return the chunks most similar to the query.<sup>[1]</sup> The weak point is that a chunk loses its document. The article's example is a chunk that reads "The company's revenue grew by 3% over the previous quarter". On its own, it names neither the company nor the quarter, so a query about "ACME Q2 2023" cannot match it, and the model cannot use it reliably even when it is retrieved.<sup>[1]</sup>

The article lists the chunking levers to tune: **chunk size, chunk boundary and chunk overlap** all affect retrieval performance.<sup>[1]</sup> It does not give universal values, and neither should an architect. Choose boundaries that follow the document's own structure (a clause, a section, an FAQ entry). Then measure.

### Contextual Retrieval fixes the lost-document problem at index time

**Contextual Retrieval** adds a short, chunk-specific explanation to each chunk before it is embedded (**Contextual Embeddings**) and before the BM25 index is built (**Contextual BM25**).<sup>[1]</sup> Claude generates that context from the whole document plus the chunk. Anthropic's prompt asks only for a succinct context that situates the chunk for search, and the output is **usually 50–100 tokens**.<sup>[1]</sup> The article notes that adding generic document summaries to chunks gave very limited gains, and summary-based indexing performed poorly. The context has to be specific to the chunk.<sup>[1]</sup>

The cost objection ("an LLM call per chunk?") has a measured answer. With prompt caching, the document is cached once and each chunk's call reads it from cache. Under the article's assumptions (800-token chunks, 8k-token documents), the one-time cost was **$1.02 per million document tokens**.<sup>[1]</sup> It is an indexing cost, paid again only when the document changes.

### The measured results

Anthropic measured **1 minus recall@20**, the share of relevant documents missing from the top 20 retrieved chunks, averaged across codebases, fiction, ArXiv and science papers.<sup>[1]</sup>

| Configuration | Top-20 retrieval failure rate | Reduction |
|---|---|---|
| Standard embeddings (baseline) | 5.7% | — |
| Contextual Embeddings | 3.7% | 35% |
| Contextual Embeddings + Contextual BM25 | 2.9% | 49% |
| Contextual Embeddings + Contextual BM25 + reranking | 1.9% | 67% |

The conclusions the article draws are worth knowing as a set:<sup>[1]</sup>

1. Embeddings plus BM25 beat embeddings alone.
2. Adding context to chunks improves retrieval accuracy a lot.
3. Reranking beats no reranking.
4. Passing the **top 20** chunks beat the top 10 or top 5 in their tests, though more chunks can also distract the model, so test on your own data.
5. **The benefits stack.**

Two cautions keep these numbers honest. First, they measure retrieval recall, not answer quality. The article itself says to run evals on the generation step too.<sup>[1]</sup> Second, the best embedding configuration in the test (Gemini Text 004) is a 2024 result. The method transfers. The specific model ranking may not.

### A contextualized embedding model is the other way to do this

Anthropic does not offer its own embedding model. Its embeddings guide uses Voyage AI as the example provider and says to evaluate several vendors.<sup>[7]</sup> Voyage offers **contextualized chunk embedding models** (`voyage-context-4`, called with `contextualized_embed()`). They produce chunk vectors that capture full-document context without manual metadata augmentation.<sup>[7]</sup> That is an alternative to generating a context string with Claude. The design question is the same: does each chunk's vector know which document it came from?

## Embeddings, lexical search and reranking each cover a different failure

*The decision*: which retrieval signals to combine, and in what order.

| Signal | Finds well | Misses |
|---|---|---|
| **Dense embeddings** | Paraphrases, concepts, "how do I…" questions | Exact strings: error codes, SKUs, statute numbers, names<sup>[1]</sup> |
| **BM25 (lexical)** | Unique identifiers and technical terms. The article's example is a query for "Error code TS-999"<sup>[1]</sup> | Synonyms and reworded questions |
| **Reranker** | Reorders a wide candidate set by relevance to the query | Anything the first stage never retrieved |

**Hybrid search** runs both first-stage retrievers, then **combines and deduplicates their results with rank fusion** before taking the top K.<sup>[1]</sup> **Reranking** is a second stage. Anthropic retrieved the **top 150** candidates, scored them with a reranker against the query, and kept the **top 20**.<sup>[1]</sup> The reranker adds runtime latency even though it scores chunks in parallel. The article frames this as a trade-off: reranking more candidates costs more latency and cost, and reranking fewer costs recall. Tune it per use case.<sup>[1]</sup> Rerankers are sold as separate models. Voyage, for example, lists `rerank-3` for accuracy and `rerank-3-lite` for latency and cost.<sup>[7]</sup>

### Embedding details that cause silent quality loss

The embeddings guide has three details that show up as "retrieval got worse and nothing errored":<sup>[7]</sup>

- **`input_type` must be set.** For retrieval, mark queries as `query` and corpus text as `document`. The guide says not to omit it. The two types get different prefixes before embedding.
- **Truncated vectors must be renormalized.** Voyage models with several output dimensions produce Matryoshka embeddings. You can shorten stored vectors by keeping the leading dimensions, but then you must **normalize them again**.
- **Quantization trades accuracy for storage.** `int8` and `binary` outputs cut storage by 4x and 32x. `float` is the default and the most accurate.

Domain models exist for code, law and finance (`voyage-code-4`, `voyage-law-2`, `voyage-finance-2`).<sup>[7]</sup> Choose one only if your evals show a gain over the general model.

### Numbers worth knowing

| Figure | Value |
|---|---|
| Fit-in-prompt threshold (article's rule of thumb) | Under ~200,000 tokens, about 500 pages<sup>[1]</sup> |
| Context added per chunk by Contextual Retrieval | Usually 50–100 tokens<sup>[1]</sup> |
| One-time contextualization cost, with caching | $1.02 per million document tokens<sup>[1]</sup> |
| Failure-rate reduction: contextual embeddings / + BM25 / + rerank | 35% / 49% / 67%<sup>[1]</sup> |
| Rerank funnel in the test | Top 150 retrieved → top 20 kept<sup>[1]</sup> |
| Voyage `voyage-4` family context length | 32,000 tokens. `voyage-context-4` accepts 120,000 with auto-chunking<sup>[7]</sup> |
| Web search price | $10 per 1,000 searches, plus tokens for the results<sup>[3]</sup> |

## Retrieval must match the data's shape and the query's pattern

*The decision*: for each kind of question, which retrieval mechanism answers it. One system often needs several.

### Structured data is queried, not embedded

Embedding rows of a table and retrieving the "most similar" rows cannot answer "total refunds by region last quarter." Pasting the whole table into the prompt does not work well either. In Anthropic's measurement of 25 aggregate questions over a 1,862-row CSV, pasting the table (about 91,000 input tokens per request) got **7 of 25** right on Claude Sonnet 5. Uploading the file and letting the model query it with code execution got **25 of 25**, at about **a twelfth of the cost**.<sup>[4]</sup> For structured data, retrieval is a query: SQL behind a tool, an API call, or code execution over a file. Embeddings belong to free text.

### Query pattern decides the retriever mix

| Query pattern | Retrieval strategy |
|---|---|
| Exact identifiers (order IDs, error codes, part numbers, citations to a clause number) | Lexical/BM25 or a direct key lookup tool. Embeddings alone are the classic miss<sup>[1]</sup> |
| Conceptual or paraphrased questions | Dense embeddings, with contextualized chunks<sup>[1]</sup> |
| Mixed (most real traffic) | Hybrid with rank fusion, then rerank<sup>[1]</sup> |
| Multi-step research where findings change the next query | Agentic, multi-step search. Anthropic's research system contrasts this with "static" RAG that fetches the chunks most similar to the query once<sup>[8]</sup> |
| Highly variable classification inputs | Retrieve similar **labelled examples** into the prompt. Anthropic's ticket-routing guide reports 71% → 93% accuracy with this<sup>[9]</sup> |

### Freshness is a property of the pipeline, not the model

An index answers with whatever was true at its last rebuild. Anthropic's context-engineering article notes that Claude Code's just-in-time navigation with glob and grep avoids **stale indexing**.<sup>[5]</sup> For information that is current, changing or outside your systems, the **web search tool** gives Claude real-time web content with citations. Results carry a `page_age` field, and you can restrict sources with `allowed_domains` or `blocked_domains` (one or the other, not both).<sup>[6]</sup> The article also describes a hybrid: retrieve some data up front for speed, and let the agent explore further on demand. It suggests this suits less dynamic content such as legal or finance work.<sup>[5]</sup>

Match the mechanism to how fast the truth changes:

- Content that changes rarely: indexed RAG with scheduled re-indexing.
- Content that changes daily: incremental re-indexing triggered by document change events.
- Values that change by the minute (stock, prices, account balances): a live tool call to the system of record, never an index.

## Search results and citations make an answer checkable

*The decision*: how retrieved text is handed to Claude, and how the answer proves where it came from.

**Search result content blocks** (`type: "search_result"`) let your retriever return chunks with a required `source` and `title` and a `content` array of text blocks. With citations enabled, Claude cites them the way it cites web search results. They can be returned **from a tool call** (dynamic RAG) or placed **directly in the user message** (pre-fetched results).<sup>[10]</sup> The details that matter in a design:<sup>[10]</sup>

- Citations on search results are **off by default**. Set `citations.enabled: true`, and use **the same setting on every search result in a request**. Mixed settings return an error.
- **The text block is the smallest citable unit.** For finer citations, split a result's content into smaller blocks.
- In a `tool_result`, if any block is a `search_result`, **all must be**. Put supporting text inside a search result.
- When a search fails, return a plain text block such as "No results found." instead of raising an error, so Claude can explain the empty result.
- If the prompt asks for **only JSON**, the response may contain few or no citations.

The **Citations** feature does the same for `document` blocks: plain text and PDFs are chunked into sentences, and **custom content** documents use your own blocks with no further chunking.<sup>[11]</sup> Compared with asking the model to quote sources in its text, the feature's citations are **guaranteed to be valid pointers** into the provided documents, and `cited_text` does not count toward output tokens.<sup>[11]</sup> Three constraints catch designs out:<sup>[11][12]</sup>

| Constraint | Consequence |
|---|---|
| **Citations and structured outputs are incompatible.** Enabling citations on any document or search result while setting `output_config.format` returns a 400 | You cannot get schema-enforced JSON and native citations in one call. Use the documented one-line-per-field pattern, then parse it |
| **Scanned PDFs without extractable text are not citable** | Run OCR before indexing, or citations silently disappear |
| **Toggling citations changes the system prompt**, which invalidates the system and message caches | Decide citations per application, not per request, or caching breaks |

Grounding also has a prompt side. The reduce-hallucinations guide recommends letting Claude say it does not know, extracting word-for-word quotes first for long documents, and having Claude find a supporting quote for each claim and retract claims it cannot support.<sup>[13]</sup> For long inputs, put the documents at the top of the prompt and the question at the end. Anthropic reports that queries at the end can improve quality by up to 30% in tests.<sup>[14]</sup>

## Diagnosing a retrieval failure starts with what changed

When answers degrade, first decide which layer failed: retrieval or generation. The test is simple and should be routine: **log the retrieved chunks with every answer**. If the right passage was not retrieved, no prompt or model change can fix the answer. If it was retrieved and the answer is still wrong, look at the prompt, grounding and model.

| Evidence in the stem | Likely cause | Fix |
|---|---|---|
| Answers cite last quarter's policy. Model, prompt and latency unchanged. Documents were updated last week | **Stale index**: the update did not trigger re-indexing, or old chunks were not deleted | Re-index on change, delete superseded chunks, store a version or date on each chunk and filter on it |
| Recall collapsed right after a corpus refresh, across all topics | **Embedding mismatch**: the corpus was re-embedded with a new model, dimension or `input_type`, but queries still use the old setup (or the reverse) | Embed queries and documents with the same model and settings. Re-embed everything when the model changes<sup>[7]</sup> |
| Recall dropped after vectors were shortened to save storage | Truncated Matryoshka vectors were not renormalized | Renormalize after truncation<sup>[7]</sup> |
| Questions with part numbers or error codes fail, conceptual questions are fine | Dense-only retrieval misses exact matches | Add BM25 and rank fusion<sup>[1]</sup> |
| The right document is retrieved but the wrong section, or chunks are about "the company" with no name | Chunks lost their document context | Contextual Retrieval or contextualized embeddings<sup>[1][7]</sup> |
| Right chunk is in the top 150 but rarely in the top 20 | Ranking, not recall | Add or tune a reranker<sup>[1]</sup> |
| Right chunks retrieved, answer still states unsupported facts | Generation-side grounding | Quote-first prompting, citations, permission to say "I don't know"<sup>[13]</sup> |
| Citations vanished after a release | Prompt now demands JSON-only, structured outputs were added (that combination returns a 400), or new PDFs are scans | Restore the text answer format or use the line-per-field pattern. OCR scans<sup>[10][11]</sup> |

### Stale indexes and embedding mismatches

*General practice, not from Anthropic documentation.*

Two operational rules prevent most of the table above. First, treat the index as derived data with a lineage: each chunk should record its source document ID, the document version or timestamp, the embedding model and its parameters. Deletes and updates in the source must flow through to the index, or the retriever will keep returning text that no longer exists. Second, vectors from different embedding models, or the same model with different dimensions, do not share a space and cannot be compared. A model change is a full re-embed and a cutover, not a rolling update. Retrieval evals should run before the cutover: a fixed set of queries with known relevant chunks, scored on recall@K (the same metric Anthropic used), compared before and after.

## Worked design review: a support assistant that quotes retired policy

**The system.** An insurer's agent-assist tool answers staff questions from 40,000 pages of policy documents, claim procedures and product sheets. Chunks are fixed 1,000-token windows, embedded with one dense model. Retrieval returns the top 5 by cosine similarity. Claude is asked to "answer in JSON with an `answer` and `sources` field."

**The complaints.**

1. Questions about specific form numbers ("What does form CL-7781 require?") return unrelated forms.
2. After a policy refresh two weeks ago, about one answer in ten quotes the retired version. Model, prompt and latency are unchanged.
3. Auditors say the `sources` field sometimes names documents that do not contain the quoted text.

**The constraint that decides.** Answers must be traceable to current source text, and the evidence points to the retrieval layer, which is what changed.

**The better design.**

- **Hybrid retrieval.** Add a contextual BM25 index next to the embeddings, fuse the rankings, retrieve about 150 candidates and rerank to about 20. This targets complaint 1, because form numbers are exact strings.<sup>[1]</sup>
- **Contextualize chunks** at index time, with the document cached while each chunk's context is generated. Split on section boundaries rather than fixed windows.<sup>[1]</sup>
- **Fix the indexer.** Version every chunk, delete superseded chunks when a policy is replaced, and filter on "current" at query time. This targets complaint 2.
- **Return chunks as `search_result` blocks with citations enabled**, and drop the JSON-only answer format. Citations then point to real passages, and `cited_text` comes from the source. This targets complaint 3.<sup>[10][11]</sup>
- **Add a retrieval eval**: a few hundred staff questions with known answer passages, scored on recall@20 before and after every index change.

**Why the tempting alternatives lose.**

- *"Move to a larger model."* The wrong passages are reaching the prompt. A stronger model reasons better over the wrong text. Family 3: wrong knob.
- *"Put all 40,000 pages in a 1M-token context."* It does not fit. Even a trimmed version would be billed on every request and would still need a freshness process. Family 2: a blunt fix that ignores cost and context rot.<sup>[2]</sup>
- *"Add a human reviewer to check sources before answers are shown."* That hides the citation defect instead of removing it, and it adds latency to every answer. Family 1: compensating control.
- *"The model's behavior changed after an update."* The stem says the model and prompt did not change. The documents did. Family 4: ignoring what changed. Model IDs are pinned snapshots in any case.<sup>[15]</sup>
- *"Raise top-K from 5 to 50."* More chunks increase distraction and cost, and they do nothing for exact-ID misses or stale chunks. The article found 20 the best of the values it tried, not "more is better."<sup>[1]</sup>

## How wrong answers are built

- **"The knowledge base fits in the 1M-token window, so drop retrieval."** Fitting is not the test. Cost per request, context rot and freshness decide it. Small and stable favors long context. Large or changing favors RAG. (Family 2)
- **"Switch to a better embedding model to fix error-code lookups."** Exact identifiers are a lexical problem. Add BM25 and rank fusion. (Family 3)
- **"Increase top-K so the right chunk is always included."** That trades precision and cost for recall that a reranker gives more cheaply. (Family 2)
- **"Ask the model to cite its sources in the JSON."** Prompted citations can point to the wrong place. Native citations are valid pointers, but they cannot be combined with structured outputs. (Family 3)
- **"Have a reviewer approve answers that cite old policy."** The defect is a stale index. Fix re-indexing and deletion. (Family 1)
- **"Lower the temperature to stop wrong answers after the document refresh."** Nothing about sampling changed. The index did. (Families 3 and 4)
- **"Embed the sales table so the agent can answer revenue questions."** Aggregates need a query or code execution, not similarity search. (Family 3)
- **"Re-index nightly to keep inventory current."** Minute-level values need a live tool call to the system of record. (Family 2)
- **"Prepend a generic document summary to each chunk."** Anthropic saw very limited gains from that. The context has to be chunk-specific. (Family 3)

## What to remember

- Under ~200k tokens and stable: consider the whole corpus in a cached prompt. Otherwise, RAG.
- Contextual Retrieval: 50–100 tokens of chunk-specific context, added before embedding **and** BM25. Failure rate drops 35% / 49% / 67% (with BM25, then reranking). Index cost $1.02 per million document tokens with caching.
- Embeddings for meaning, BM25 for exact strings, rank fusion to combine, reranker to reorder (150 → 20 in the test).
- Set `input_type`. Renormalize truncated vectors. Use the same embedding setup for queries and documents.
- Structured data: query it with a tool or code execution (25/25 vs 7/25 when pasted).
- Freshness: re-index on change for documents, live tools for fast-changing values, web search for the open web.
- `search_result` blocks: `source` and `title` required, citations off by default, all-or-nothing per request, text blocks are the smallest citable unit.
- Citations + structured outputs = 400. JSON-only prompts suppress citations. Scanned PDFs are not citable. Toggling citations breaks the cache.
- Diagnose by layer: log retrieved chunks. Wrong chunks mean retrieval. Right chunks with wrong answer means generation.

## Endnotes for this chapter

1. Contextual Retrieval: the 200k-token long-prompt alternative, the standard and hybrid RAG pipelines, BM25 for exact identifiers, chunk-specific context of 50–100 tokens, the $1.02 per million document tokens cost with caching, the 35%/49%/67% failure-rate reductions on 1 minus recall@20, the 150 → 20 rerank funnel, chunking considerations, and the stacking conclusions. Anthropic, "Introducing Contextual Retrieval" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/contextual-retrieval
2. Context window sizes, the 1M-token default with standard pricing, Claude Haiku 5.5's higher pricing above 100,000 tokens, and context rot. Anthropic, "Context windows" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/context-windows
3. Long context pricing, Claude Haiku 5.5's prompt-length pricing, and web search at $10 per 1,000 searches plus token costs. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
4. Keeping data files out of the prompt: 25 aggregate questions over a 1,862-row CSV, 7 of 25 correct when pasted versus 25 of 25 with the Files API and code execution, at about a twelfth of the cost. Anthropic, "Optimizing for cost and intelligence" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence
5. Just-in-time retrieval with lightweight identifiers, the hybrid up-front plus exploration strategy, and glob/grep bypassing stale indexing. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
6. The web search tool's real-time content, citations, `page_age`, and mutually exclusive `allowed_domains` and `blocked_domains`. Anthropic, "Web search tool" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
7. Anthropic has no embedding model of its own. The page covers Voyage AI models and rerankers, contextualized chunk embeddings, the `input_type` requirement, Matryoshka truncation with renormalization, and quantization trade-offs. Anthropic, "Embeddings" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/embeddings
8. Static RAG versus the multi-step, adaptive search used in Anthropic's Research system. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/multi-agent-research-system
9. Retrieving similar examples from a vector database for highly variable tickets, reported to raise accuracy from 71% to 93%. Anthropic, "Ticket routing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/ticket-routing
10. Search result blocks: required fields, delivery from tool calls or as top-level content, citations off by default and all-or-nothing, block-level citation granularity, tool-result mixing rules, empty-result handling, and the JSON-only caveat. Anthropic, "Search results" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/search-results
11. Citations: document types and chunking, guaranteed valid pointers versus prompt-based citing, `cited_text` not counted as output tokens, incompatibility with structured outputs, and non-citable scanned PDFs. Anthropic, "Citations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/citations
12. Toggling citations modifies the system prompt and invalidates the system and message caches. Anthropic, "Prompt caching" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-caching
13. Allowing "I don't know," quote-first grounding for long documents, and claim-by-claim verification with retraction. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
14. Long-context prompting: documents at the top, queries at the end (up to 30% better in tests), and XML-wrapped documents with source metadata. Anthropic, "Prompting best practices" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
15. Every model ID is a pinned snapshot whose weights do not change. Anthropic, "Model IDs and versioning" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions
