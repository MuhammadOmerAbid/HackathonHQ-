import re
from collections import Counter

css_path = r"e:\django-00\L1\frontend\styles\global.css"
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

# Find all selectors (hacky but works for duplicates)
selectors = re.findall(r'^([^{}]+)\s*\{', css_content, re.MULTILINE)
cleaned_selectors = [s.strip() for s in selectors if s.strip() and not s.strip().startswith('@')]

counts = Counter(cleaned_selectors)
duplicates = {k: v for k, v in counts.items() if v > 1}

print("Duplicate Selectors Found in global.css:")
for k, v in duplicates.items():
    print(f"{k}: defined {v} times")
