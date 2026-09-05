---
title: "Regime-Preserving Bootstrap for FX Fair-Value Models"
date: 2026-06-04
tags: ["Python", "FX", "bootstrap", "BEER", "FEER", "PPP", "macro"]
author: ["David Vossebürger"]
description: "Methodology, metrics, and empirical validation of a regime-preserving bootstrap procedure for FX fair-value strategies."
summary: "Two regime-aware bootstrap resamplers (Regime-Uniform and Regime-Markov) for FX fair-value strategies (BEER, FEER, PPP), validated against naive baselines on three currency pairs."
editPost:
    URL: "https://github.com/DavidVossebuerger/MC-Regime"
    Text: "Source code"

---

---

##### Overview

Standard block-bootstrap methods (IID, Moving Block, Stationary Block) destroy the economic regime structure of macro-FX data and thereby bias Sharpe ratio inference. This project proposes two regime-aware resamplers:

- **Regime-Uniform** — resampling of entire regime blocks uniformly at random.
- **Regime-Markov** — resampling of entire regime blocks via a calibrated Markov transition matrix.

Validated against three naive baselines on three currency pairs (EURUSD, GBPUSD, USDJPY) at B = 1999 bootstrap replicates with a BEER fair-value pricer.

**Key result:** Regime-Markov reduces the cross-pool Sharpe loss by a factor of **1.35×** over Regime-Uniform and by **4.59×** over the naive IID baseline.

---

##### Methodology highlights

- **Regime taxonomy:** 8 expert-defined EUR/USD macro-monetary regimes (PRE_GFC, GFC, EURO_CRISIS_ERA, TAPER_TRANSITION, NIRP_DOVISH, COVID, INFLATION_SHOCK, DISINFLATION)
- **BEER pricer:** Clark-MacDonald (1998) reduced form with FMOLS estimation and HAC standard errors
- **Bootstrap:** 5 methods compared (IID, MBB, SB, Regime-Uniform, Regime-Markov)
- **Metrics:** L0 (Sharpe loss), L1 (correlation), L2 (Wasserstein), L3 (network/spectral), L4 (temporal), arrangement (composition/transition)
- **Statistics:** Paired sign test with BH-FDR; smallest achievable p-value is 0.25 for n = 3 paired tests
- **§11.7 gate:** Sinkhorn-Knopp calibration of the transition matrix; TV drift must be < 0.10

---

##### Quick start

```bash
git clone https://github.com/DavidVossebuerger/MC-Regime.git
cd MC-Regime
pip install -e .

python3 -u mc_regime/scripts/run_poc.py \
    --replications 1999 --pairs all --pricer beer \
    --calibrate-target empirical --output outputs/runs/main
```

FRED panel + FX parquets are committed in `mc_regime/outputs/data/`; no API key required. Wall-clock ~25 minutes on a modern multi-core CPU.

---

##### Related paper

+ [Regime-Preserving Bootstrap for FX Fair-Value Models (SSRN 6890880)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6890880)
+ Full PDF: `docs/paper.pdf` (14 pages)
