"""Variant service for managing game variants."""

import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import HTTPException

from rules import RuleParser


class VariantService:
    """Service for variant-related operations."""

    def __init__(self):
        self.parser = RuleParser()
        self.api_dir = Path(__file__).parent.parent

    def list_variants(self) -> List[str]:
        """List all available variants."""
        return self.parser.list_variants()

    def get_variant_rules(self, variant_name: str) -> Dict[str, Any]:
        """Get rules for a specific variant."""
        if variant_name not in self.list_variants():
            raise HTTPException(
                status_code=404,
                detail=f"Variant '{variant_name}' not found"
            )

        config_file = self.api_dir / "config" / "variants" / f"{variant_name}.json"
        with open(config_file, 'r') as f:
            return json.load(f)

    def load_variant_config(self, variant_name: str) -> Dict[str, Any]:
        """Load variant configuration file."""
        config_file = self.api_dir / "config" / "variants" / f"{variant_name}.json"
        if not config_file.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Variant '{variant_name}' not found"
            )
        with open(config_file, 'r') as f:
            return json.load(f)
