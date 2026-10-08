---
name: aegis-bird-poi-monitoring
description: Use when an agent uses Bird/X collection for AEGIS protective-intelligence POI monitoring, watchlist updates, negative-sentiment sweeps, evidence preservation, or dashboard handoff.
version: 1.0.0
author: Aegis Research Group / Hermes Agent
license: Proprietary
metadata:
  hermes:
    tags: [aegis, bird, x, protective-intelligence, poi, watchlist, evidence-preservation]
    related_skills: [aegis-doctrine, x-threat-intel-ingestion]
---

# AEGIS Bird POI Monitoring

## Overview

Use Bird as a **read-only X/Twitter collector** inside an AEGIS protective-intelligence workflow. This skill teaches agents how to consume a POI registry, plan Bird collection, preserve raw evidence, normalize posts into observations/findings, attach relevant posts to POI records, and hand results to dashboards or human analysts.

Core posture:

- Defensive monitoring only
- No engagement with POIs
- Evidence-first collection
- Human-reviewed assessment and escalation
- Explicit confidence and uncertainty

## When to Use

Use this skill when:

- An agent is given an `aegis.poi_registry.v1` registry.
- An agent needs to monitor POIs or watchlist actors with Bird.
- An agent needs to produce a negative-sentiment or threat-sweep report from X data.
- An agent needs to attach threatening/negative posts to a POI record.
- An agent needs to hand POI data to a dashboard, Sentinel runtime, or analyst review queue.

Do **not** use this skill for:

- Posting, replying, liking, following, DMing, blocking, muting, or interacting with actors.
- Expanding scope beyond assigned principals/POIs.
- Diagnosing mental health.
- Bypassing human review for escalation.
- Revealing credentials, cookies, tokens, private keys, or `.env` contents.

## Required Inputs

Preferred input:

- A validated `aegis.poi_registry.v1` registry containing one or more `aegis.poi.v1` records.

A POI record should contain:

- `poi_id`
- `record_status`
- `lifecycle_status`
- `principals[]`
- `accounts[]`
- `monitoring`
- `assessment`
- `review`
- `governance`
- optional `evidence_refs[]`

If the registry is missing required fields, stop and request or create a draft record before collecting.

## Read-Only Bird Commands

Allowed commands for POI monitoring:

```bash
bird user-tweets <handle> -n 50 --json
bird search '<query>' -n 50 --json
bird read <tweet-url-or-id> --json
bird thread <tweet-url-or-id> --json
bird replies <tweet-url-or-id> --json
```

Use following/followers only when authorized and relevant:

```bash
bird following --user <user-id> -n 50 --json
bird followers --user <user-id> -n 50 --json
```

Never use actor-facing commands from a POI workflow.

## Standard Workflow

### 1. Validate registry

Confirm JSON parses and records include required fields.

```bash
python3 -m json.tool poi_registry.json >/dev/null
```

If available, validate against the AEGIS schema.

### 2. Plan before collection

Dry-run or list planned Bird commands before live collection.

If the AEGIS wrapper is available:

```bash
python /opt/data/aegis/tools/bird_poi_monitor.py \
  --registry poi_registry.json \
  --principal <principal-slug> \
  --dry-run
```

Expected output: a `collection_manifest.json` with read-only commands.

### 3. Execute collection

Run only approved commands. Save raw JSON before analysis.

```bash
python /opt/data/aegis/tools/bird_poi_monitor.py \
  --registry poi_registry.json \
  --principal <principal-slug>
```

Raw outputs should be stored under a run directory, for example:

```text
/opt/data/aegis/sweeps/poi-monitoring/<principal>/<run_id>/raw/
```

### 4. Normalize observations

Convert raw Bird output into observations containing:

- `observation_id`
- `poi_id`
- `principal_id` / `principal_slug`
- platform
- URL or source ID
- handle/account ID
- posted timestamp
- observed timestamp
- content text or media description
- engagement metrics if available
- source type
- provenance

### 5. Classify content with AEGIS L1-L5

- **L1 Archive / Noise:** negative but non-specific.
- **L2 Fixation:** repeated attention or monitoring without threat.
- **L3 Targeted Grievance:** direct hostility, grievance, conspiracy, or dehumanizing rhetoric.
- **L4 Mobilization:** calls to action, doxxing, explicit threats, leakage, or credible targeting indicators short of imminent action.
- **L5 Imminent:** specific credible threat with time/place/capability or imminent approach indicators.

L3+ content requires formal evidence preservation.

### 6. Preserve evidence

For every L3+ item, and any L1/L2 item important to pattern history, create an evidence artifact with:

- platform
- URL or direct content ID
- username/handle/account ID
- posted timestamp
- observed timestamp
- exact content or accurate media description
- engagement metrics at observation time
- AEGIS level
- reason flagged
- artifact path
- hash if available

### 7. Attach evidence to POI

The POI record should reference evidence, not merely paste all raw data inline.

Use `evidence_refs[]`:

```json
{
  "evidence_id": "ev_20261007_001",
  "source_type": "primary_observation",
  "platform": "x",
  "url": "https://x.com/example/status/123",
  "observed_at": "2026-10-07T13:00:00Z",
  "description": "AEGIS L3 targeted grievance toward principal",
  "artifact_path": "/path/to/evidence/ev_20261007_001.json",
  "hash_sha256": "..."
}
```

Also link evidence IDs inside assessment domain fields where relevant.

### 8. Update POI assessment draft

Update only with observed behavior. Do not diagnose or overclaim.

Include:

- highest AEGIS content level
- EP Tier candidate
- client-facing level
- confidence
- behavioral-domain rationales
- trajectory indicators
- uncertainties
- recommended human action

### 9. Generate handoff artifacts

Output:

- `collection_manifest.json`
- `observations.json`
- `candidate_findings.json`
- updated POI registry or patch
- negative-sentiment report
- evidence artifacts

### 10. Require human review

AI may draft, but humans approve:

- final POI classification
- watchlist status changes
- handler/CSO escalation
- client-facing reports

## Evidence Storage Rule

Yes: save negative/threat-relevant posts and attach them to POI records.

Recommended split:

```text
Raw evidence artifacts: immutable, hashable, source-level records
POI registry record: current assessment + evidence_refs[]
Report: generated snapshot for analyst/client review
```

Do not store credentials or collection cookies in any evidence artifact, registry, manifest, or report.

## Report Format

For a negative-sentiment report, include:

- sweep window
- principal and POI scope
- sources reviewed
- total content reviewed
- findings by AEGIS level
- L3+ flagged content cards
- watchlist / POI updates
- threat landscape change
- recommended actions
- gaps and uncertainties
- evidence preservation notes

Every L3+ card should include:

- posted timestamp
- observed timestamp
- platform
- handle
- content
- URL/ID
- AEGIS level
- confidence
- reason flagged
- evidence artifact path/hash
- recommended action

## Common Pitfalls

1. **Treating a POI as only a handle.** A POI needs scope, assessment, evidence, review state, and governance metadata.

2. **Mixing raw evidence with mutable assessment.** Preserve raw artifacts separately; POI records should reference them.

3. **Skipping dry-run planning.** Always plan commands before collection, especially for new agents.

4. **Over-escalating criticism.** L1/L2 content is often noise unless it becomes a pattern.

5. **Under-preserving L3+ content.** Deleted posts can become important. Preserve serious content immediately.

6. **Engaging with POIs.** No likes, follows, replies, DMs, blocks, or mutes from monitoring workflows.

7. **Outputting secrets.** Never print cookies, tokens, `.env` contents, private keys, or auth headers.

## Verification Checklist

Before finalizing a run:

- [ ] Registry parsed successfully.
- [ ] Collection plan contained only read-only Bird commands.
- [ ] Raw Bird JSON was saved before analysis.
- [ ] Observations include platform, handle, URL/ID, posted time, observed time, and content.
- [ ] L3+ items have evidence artifacts.
- [ ] POI record has `evidence_refs[]` for relevant posts.
- [ ] Assessment separates facts, source claims, AI inference, and analyst assessment.
- [ ] Confidence and uncertainty are stated.
- [ ] No credentials or internal secrets appear in outputs.
- [ ] Human review is required before escalation.
