"""Stable citation IDs from docs/research/REFERENCES.md, stamped into
every pipeline output so each artifact stays scientifically traceable."""

CITATIONS = {
    "trigger_design": [
        "IPCC6-CH9", "MERRIFIELD-2011", "WIDLANSKY-2014", "WIDLANSKY-2015",
        "PCRAFI", "ARC", "NOAA-SLT", "PSMSL",
    ],
    "risk_allocation": [
        "WB-CCKP", "WIDLANSKY-2015", "OWID-CO2", "OWID-CO2-COUNTRY",
        "GCB", "PCRIC",
    ],
    "forecast_method": ["FPP3", "STATSMOLS", "NIST-PI"],
    "data_sources": ["PDH-SEA", "NOAA-SLT", "PSMSL", "NASA-SL", "WB-CCKP"],
    "loss_and_damage_framing": ["UNFCCC-FRLD", "COP28-1CP28", "SNLD", "IPCC6-CH9"],
    "oracle_verification": ["EIP-712", "CHAINLINK", "GOFFARD-2025", "CONDON-2017"],
    "impact_water_security": ["WERNER-2017", "BAILEY-2014"],
}

OUTPUT_CITATIONS = {
    "trigger_params": ["trigger_design", "data_sources"],
    "forecasts": ["forecast_method", "data_sources"],
    "risk_allocation": ["risk_allocation", "loss_and_damage_framing"],
    "backtest_report": ["trigger_design", "data_sources"],
}


def citations_for(output_name):
    """Return {topic: [reference IDs]} for a given output file."""
    return {
        topic: list(CITATIONS[topic])
        for topic in OUTPUT_CITATIONS[output_name]
    }
