import re
from typing import Dict, List, Tuple, Optional
from pydantic import BaseModel

class ProtectedItem(BaseModel):
    id: str               # e.g., "[[MJ_PROTECTED_0001]]"
    index: int            # 1
    category: str         # "math", "placeholder", "url", "number", etc.
    original_value: str   # "{nombre}", "sen(30°)", etc.

class ProtectionResult(BaseModel):
    protected_text: str
    items: List[ProtectedItem]
    item_map: Dict[str, str]  # token -> original_value

class ContentProtector:
    """
    Detects and shields mathematical formulas, variables, placeholders,
    URLs, code, and technical tokens before sending to LLM.
    Restores them with exact byte-level fidelity.
    """

    TOKEN_PREFIX = "[[MJ_PROTECTED_"
    TOKEN_SUFFIX = "]]"
    TOKEN_REGEX = re.compile(r"\[\[\s*MJ_PROTECTED_(\d+)\s*\]\]")
    RELAXED_TOKEN_REGEX = re.compile(r"\[\s*\[\s*MJ_PROTECTED_(\d+)\s*\]\s*\]")

    def __init__(self):
        # Prioritized regex patterns: (category, compiled_pattern)
        # Order matters: larger/more specific structures must match first
        self.patterns: List[Tuple[str, re.Pattern]] = [
            # 1. URLs and emails
            ("url", re.compile(r"https?://[^\s<>\"')]+", re.IGNORECASE)),
            ("email", re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", re.IGNORECASE)),

            # 2. LaTeX / KaTeX / MathJax blocks
            ("latex", re.compile(r"\$\$.*?\$\$", re.DOTALL)),
            ("latex", re.compile(r"\$.*?\$")),
            ("latex", re.compile(r"\\\(.*?\\\)")),
            ("latex", re.compile(r"\\\[.*?\\\]")),
            ("latex", re.compile(r"\\[a-zA-Z]+(?:\{[^{}]*\})+")),

            # 3. HTML / XML tags & code
            ("code", re.compile(r"<code>.*?</code>", re.DOTALL | re.IGNORECASE)),
            ("html", re.compile(r"</?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*?)?>")),

            # 4. Placeholders & template variables
            ("placeholder", re.compile(r"\{\{[a-zA-Z0-9_.\-]+\}\}")),          # {{user}}
            ("placeholder", re.compile(r"\$\{[a-zA-Z0-9_.\-]+\}")),           # ${value}
            ("placeholder", re.compile(r"\{[a-zA-Z0-9_.\-]+\}")),             # {nombre}
            ("placeholder", re.compile(r"%[a-zA-Z0-9_]+%")),                  # %score%
            ("placeholder", re.compile(r"%\([a-zA-Z0-9_]+\)[sdf]")),          # %(name)s
            ("placeholder", re.compile(r"\[[a-zA-Z0-9_]+\]")),                 # [player_name]

            # 5. Trigonometric and math functions with arguments
            ("math_func", re.compile(r"\b(?:sen|sin|cos|tan|ctg|tg|sec|csc)\s*\([^)]+\)", re.IGNORECASE)),

            # 6. Equations and identities (e.g., sen(α) = 3/5, x + 2 = 5)
            ("math_eq", re.compile(r"\b[a-zA-Zαβγδεθλμπστω]\([^)]+\)\s*=\s*[0-9/a-zA-Zαβγδεθλμπστω.\-+*]+")),

            # 7. Fractions with roots, pi, or numbers
            ("math_expr", re.compile(r"(?:[π√]\S*|\d+)\s*/\s*(?:[π√]\S*|\d+)")), # π/2, √3/2, 3/5
            ("math_expr", re.compile(r"√\d+(?:\.\d+)?")),                        # √3, √25
            ("math_expr", re.compile(r"\bπ\b")),                                # π alone

            # 8. Variable powers and indices
            ("math_expr", re.compile(r"\b[a-zA-Z][²³⁴⁵⁶⁷⁸⁹⁰]")),                 # x², y³
            ("math_expr", re.compile(r"\b[a-zA-Z]\^[0-9]+")),                   # x^2

            # 9. Degrees, percentages, angles
            ("unit", re.compile(r"\b\d+(?:[.,]\d+)?\s*°")),                     # 30°, 45°
            ("unit", re.compile(r"\b\d+(?:[.,]\d+)?\s*%")),                     # 50%, 12.5%

            # 10. Isolated Greek math variables
            ("math_symbol", re.compile(r"(?<![a-zA-Z0-9_])[αβγδεθλμστω](?![a-zA-Z0-9_])")),

            # 11. Standalone numbers (decimals and integers)
            ("number", re.compile(r"(?<![a-zA-Z0-9_#])\d+(?:[.,]\d+)?(?![a-zA-Z0-9_#])")),
        ]

    def protect(self, text: str) -> ProtectionResult:
        """
        Scans text and replaces all protected elements with [[MJ_PROTECTED_XXXX]].
        Returns ProtectionResult with the masked text and mapping details.
        """
        if not text:
            return ProtectionResult(protected_text="", items=[], item_map={})

        working_text = text
        items: List[ProtectedItem] = []
        item_map: Dict[str, str] = {}
        counter = 1

        # We mask iteratively on non-placeholder text to prevent re-matching
        # We replace matches with a unique temporary sentinel or directly with [[MJ_PROTECTED_XXXX]]
        # To avoid regex matching inside previously inserted [[MJ_PROTECTED_XXXX]] tokens,
        # we check existing tokens.
        for category, pattern in self.patterns:
            matches = list(pattern.finditer(working_text))
            if not matches:
                continue

            # Process matches from right to left to keep string indices valid
            for m in reversed(matches):
                match_str = m.group(0)
                start, end = m.span()

                # If this match overlaps with an already inserted token [[MJ_PROTECTED_...]], skip
                prefix_context = working_text[max(0, start - 15):min(len(working_text), end + 15)]
                if "MJ_PROTECTED_" in prefix_context:
                    # Verify if this match is inside a token
                    token_span_match = False
                    for existing_token in re.finditer(r"\[\[MJ_PROTECTED_\d+\]\]", working_text):
                        t_start, t_end = existing_token.span()
                        if not (end <= t_start or start >= t_end):
                            token_span_match = True
                            break
                    if token_span_match:
                        continue

                token = f"[[MJ_PROTECTED_{counter:04d}]]"
                item = ProtectedItem(
                    id=token,
                    index=counter,
                    category=category,
                    original_value=match_str
                )
                items.append(item)
                item_map[token] = match_str
                working_text = working_text[:start] + token + working_text[end:]
                counter += 1

        # Sort items in ascending index order
        items.sort(key=lambda x: x.index)
        return ProtectionResult(
            protected_text=working_text,
            items=items,
            item_map=item_map
        )

    def restore(self, text: str, item_map: Dict[str, str]) -> str:
        """
        Replaces all [[MJ_PROTECTED_XXXX]] tokens with their original values.
        Supports minor LLM formatting variants (like extra internal spaces).
        """
        if not text or not item_map:
            return text

        restored = text

        # 1. Match standard format [[MJ_PROTECTED_0001]] with optional spaces
        def replace_standard(match: re.Match) -> str:
            num_str = match.group(1)
            token = f"[[MJ_PROTECTED_{int(num_str):04d}]]"
            return item_map.get(token, item_map.get(f"[[MJ_PROTECTED_{num_str}]]", match.group(0)))

        restored = self.TOKEN_REGEX.sub(replace_standard, restored)

        # 2. Match relaxed format [ [MJ_PROTECTED_0001] ]
        restored = self.RELAXED_TOKEN_REGEX.sub(replace_standard, restored)

        # 3. Direct string replacement fallback for any remaining exact tokens
        for token, original in item_map.items():
            if token in restored:
                restored = restored.replace(token, original)

        return restored
