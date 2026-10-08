# AEGIS POI Monitoring Bridge

This document defines a read-only integration pattern for using `bird` inside AEGIS-style protective-intelligence workflows.

The goal is to let AI agents, dashboards, and analysts share a consistent POI/watchlist format while using Bird as the X/Twitter collection layer.

## Safety posture

`bird` POI workflows must be **read-only by default**.

Allowed:

- `user-tweets`
- `search`
- `read`
- `thread`
- `replies`
- `following` / `followers` when authorized and relevant
- evidence preservation of public/authenticated-public observations

Not allowed from POI workflows without explicit human authorization:

- tweet
- reply
- like/unlike
- follow/unfollow
- bookmark/unbookmark
- DM
- block/mute or any actor-facing engagement

The POI workflow should support protective intelligence, not interaction with persons of interest.

## Core concept

A POI is not just an X handle. A POI record should include:

- stable internal `poi_id`
- protected principal scope
- associated accounts
- monitoring cadence and query definitions
- current AEGIS L1-L5 content posture
- current EP Tier 1-5 actor posture
- evidence references
- human-review state
- governance/audit metadata

Bird should consume the registry, collect matching public/authenticated-public content, and output raw JSON plus a collection manifest.

```text
POI registry
  -> bird read-only collection
  -> raw JSON evidence
  -> collection_manifest.json
  -> normalizer / AEGIS agent
  -> observations + findings + evidence_refs
  -> dashboard / human review
```

## Registry location

A portable registry should validate against the AEGIS POI registry schema:

- `aegis.poi_registry.v1`
- records contain `aegis.poi.v1`

A sanitized sample registry is included at:

`examples/aegis-poi-registry.sample.json`

## Minimal command contract

A future native Bird implementation should expose:

```bash
bird poi validate --registry pois.json
bird poi plan --registry pois.json --principal <slug>
bird poi run --registry pois.json --principal <slug> --out-dir ./aegis-sweeps
bird poi export --registry pois.json --format dashboard
```

Until native commands exist, agents can use the companion runner pattern from the AEGIS workspace:

```bash
python /opt/data/aegis/tools/bird_poi_monitor.py \
  --registry /path/to/poi_registry.json \
  --principal principal-slug \
  --dry-run
```

## Expected collection manifest

Bird or the wrapper should output a manifest like:

```json
{
  "schema_version": "aegis.bird_poi_collection.v0",
  "generated_at": "2026-10-07T13:26:39Z",
  "principal": "test-acme-ceo",
  "registry_path": "/path/to/test_poi_registry.json",
  "dry_run": true,
  "items": [
    {
      "poi_id": "poi_test_synthetic_actor_001",
      "platform": "x",
      "handle": "test_actor_pi",
      "query_id": "timeline",
      "purpose": "actor_timeline",
      "query": "from:test_actor_pi since:2026-10-01",
      "command": ["bird", "user-tweets", "test_actor_pi", "-n", "50", "--json"],
      "raw_path": null,
      "collected_at": "2026-10-07T13:26:39Z",
      "exit_code": null,
      "raw_count_hint": null,
      "error": null
    }
  ],
  "notes": [
    "Read-only collection wrapper around Bird.",
    "No engagement actions are performed.",
    "Raw Bird outputs are preserved separately from derived analysis."
  ]
}
```

## Evidence attachment rule

Posts that are negative, threatening, mobilizing, doxxing, fixation-related, or otherwise relevant should be preserved as evidence artifacts and attached to the POI through `evidence_refs[]`.

Recommended split:

- Raw post artifacts are immutable and hashable.
- POI records store references and assessment state.
- Reports are generated snapshots from POI + evidence.

Do not store credentials, cookies, private tokens, or `.env` values in registries, manifests, evidence artifacts, or reports.

## Agent training guidance

When an AI agent uses Bird for AEGIS workflows, instruct it to:

1. Load or receive a validated POI registry.
2. Run `bird poi plan` or equivalent dry run first.
3. Execute only read-only collection commands.
4. Save raw output before analysis.
5. Normalize raw posts into observations.
6. Attach relevant posts to `evidence_refs[]`.
7. Draft AEGIS levels and EP tiers with confidence and uncertainty.
8. Require human review before escalation or external action.
9. Never engage with POIs.

## Implementation note

The current `dannywmarks/bird-cli` checkout appears to include compiled `dist/` files but not the TypeScript `src/` tree. Native command work should be done against a source-complete branch or upstream sync. Until then, keep this bridge as docs/examples plus an external runner.
