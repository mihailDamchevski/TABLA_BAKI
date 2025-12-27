#!/usr/bin/env python3
"""Main entry point for TABLA BAKI - Backgammon Rules Interpreter."""

import argparse
import sys
from pathlib import Path

# Add game-engine to path
sys.path.insert(0, str(Path(__file__).parent))

from ui import CLI
from rules import RuleParser


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="TABLA BAKI - Backgammon Rules Interpreter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                    # Play standard backgammon
  python main.py --variant standard  # Play standard backgammon
  python main.py --list-variants     # List available variants
        """
    )
    
    parser.add_argument(
        '--variant',
        '-v',
        default='standard',
        help='Game variant to play (default: standard)'
    )
    
    parser.add_argument(
        '--list-variants',
        action='store_true',
        help='List available game variants and exit'
    )
    
    args = parser.parse_args()
    
    # List variants if requested
    if args.list_variants:
        rule_parser = RuleParser()
        variants = rule_parser.list_variants()
        if variants:
            print("Available variants:")
            for variant in variants:
                print(f"  - {variant}")
        else:
            print("No variants found. Check config/variants/ directory.")
        return
    
    # Start game
    try:
        cli = CLI(variant=args.variant)
        cli.start()
    except KeyboardInterrupt:
        print("\n\nGame interrupted. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
