---
title: "PO3 ICT Backtesting Framework"
date: 2026-01-25
tags: ["Python", "backtesting", "ICT", "PO3", "FX", "reproducibility"]
author: ["David Vossebürger"]
description: "Modular Python backtesting framework for empirical evaluation of ICT/PO3 trading strategies across six instruments over 18 years of M30 data."
summary: "Modular Python framework that translates discretionary ICT concepts (killzones, FVG, order blocks, breaker blocks, CISD) into deterministic, reproducible algorithms and tests them across six instruments."
editPost:
    URL: "https://github.com/DavidVossebuerger/po3-ict-backtesting"
    Text: "Source code"

---

---

##### Overview

Modular Python backtesting framework for the empirical evaluation of ICT (Inner Circle Trader) / PO3 trading strategies. Translates discretionary ICT concepts — killzones, fair value gaps, order blocks, breaker blocks, CISD — into deterministic, reproducible algorithms and tests them across six instruments over 18 years of M30 data.

**Key finding:** Across all six instruments and 108 parameter configurations, no combination produces a positive risk-adjusted return under realistic retail transaction costs.

---

##### Instruments tested

EURUSD, GBPUSD, USDJPY, XAUUSD, USA500IDXUSD, USATECHIDXUSD — all Dukascopy M30 bid data.

---

##### Strategies

- **Daily Swing Framework** — Reversal/continuation signals from prior-day wick levels, gated by PDA confluence (FVG, Order Block, Breaker) and killzone filters.
- **Composite** — Signal aggregator combining daily-swing with an ICT confluence scorer.
- **Buy & Hold, MA Crossover, Random Baseline** — Benchmarks for comparison.

---

##### Diagnostics

Walk-forward (7 windows), parameter sensitivity (18 configs), cost sensitivity (3 scenarios), Monte Carlo (1000 iterations, EURUSD), stress tests, phase comparison (Cal / OOS / Forward), statistical tests vs. Buy & Hold.

---

##### Related papers

+ [Regelbasierte Evaluierung von PO3-inspirierten ICT-Strategien (SSRN 6410578)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6410578)
+ [Rule-Based Evaluation of PO3-Inspired ICT Strategies (SSRN 6700099)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6700099)

---

##### Quick start

```bash
git clone https://github.com/DavidVossebuerger/po3-ict-backtesting.git
cd po3-ict-backtesting
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m backtesting_system.main --symbols EURUSD --quick
```
