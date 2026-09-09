# HighTide Protocol: 3-Minute Demo Script

**Objective**: Showcase the scientific foundation (UI) and the flawless technical execution of the smart contracts (Terminal) in under 3 minutes.
**Preparation**: 
- Have 2 windows side-by-side or easily swappable: The Next.js web app UI and your Terminal.
- In terminal, make sure you are in `contracts/` directory.

---

## 0:00 - 0:45 | Act 1: The Problem & The Science (Web UI)
*Action: Scroll through the website landing page slowly.*
- **Voiceover**: "Welcome to HighTide Protocol. Pacific Island countries emit the least carbon but suffer the most from rising sea levels, which devastate their Water, Sanitation, and Hygiene (WASH) infrastructure. HighTide is an AI-forecasted, blockchain-triggered Loss & Damage fund designed to automatically disburse funds when scientific thresholds are crossed."
- *Action: Stop at the AI Forecast to 2030 chart.*
- **Voiceover**: "Our AI engine uses historical sea-level data and ENSO indexes to train statistical models like Bayesian Structural Time Series, predicting risks up to 2030. Every data point and citation on this dashboard resolves to official scientific sources."
- *Action: Show the new Gemini AI Strategy feature, click 'Generate' on a nation.*
- **Voiceover**: "We also integrated Google Gemini 3.5 Flash to dynamically propose scientific, nation-specific WASH recovery strategies based on these forecasted parametric payouts."

## 0:45 - 1:45 | Act 2: Deploying & Funding (Terminal)
*Action: Switch to Terminal. Run `npm run demo:deploy`*
- **Voiceover**: "Let's see the protocol in action. I'm deploying our Solidity smart contracts to a local testnet for maximum speed. Notice that 13 Pacific nations are configured with their specific risk weights, and our AI pipeline's data hashes are anchored on-chain for provenance."
- *Action: Run `npm run demo:fund`*
- **Voiceover**: "Next, a donor or climate fund deposits into the HighTide Pool. We've just funded the pool with 10 million test tokens. The smart contracts are now armed and ready."

## 1:45 - 2:30 | Act 3: Live Payout (Terminal & Web UI)
*Action: Run `npm run demo:lanina`*
- **Voiceover**: "Now for the magic. We're replaying real, historical sea-level readings from Tuvalu during the 2020-2022 La Niña event. Watch the terminal..."
- *Action: Highlight the payouts popping up on the terminal.*
- **Voiceover**: "Boom. The contract verifies the oracle signatures, evaluates the anomaly against Tuvalu's trend-adjusted threshold, and instantly triggers multi-tiered payouts. No paperwork, no delays—just pure, programmatic climate justice."
- *Action: Quickly swap to the Web UI Live Payout Panel to show the on-chain data updating (if running).*

## 2:30 - 3:00 | Act 4: Security & Conclusion (Terminal)
*Action: Run `npm run demo:attack`*
- **Voiceover**: "But what if someone tries to exploit the fund by resubmitting the exact same disaster reading to get paid twice?"
- *Action: Point to the RED 'ATTACK BLOCKED' text in terminal.*
- **Voiceover**: "The transaction is instantly reverted. Our contract enforces a strict one-payout-per-event rule, guaranteeing the funds are secure from double-counting. HighTide is ready to bring transparency and speed to the UN Loss & Damage Fund. Thank you."
