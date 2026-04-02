import os
import re

css_path = r"e:\django-00\L1\frontend\styles\global.css"
frontend_dir = r"e:\django-00\L1\frontend"

# Read CSS
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

# Extract all class names from CSS
# It looks for .classname{ or .classname { or .classname, or .classname:
classes_in_css = set(re.findall(r'\.([a-zA-Z0-9_-]+)', css_content))

# Collect all js/jsx files
jsx_content = ""
for root, dirs, files in os.walk(frontend_dir):
    if "node_modules" in root or ".next" in root:
        continue
    for file in files:
        if file.endswith((".jsx", ".js")):
            with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                jsx_content += f.read() + "\n"

# Verify which classes are used
unused_classes = []
used_classes = []

for cls in classes_in_css:
    # Just check if the word cls exists in the jsx content
    # (very naive but prevents false positives for dynamic classes)
    if cls in jsx_content:
        used_classes.append(cls)
    else:
        unused_classes.append(cls)

print(f"Total CSS Classes: {len(classes_in_css)}")
print(f"Used: {len(used_classes)}")
print(f"Unused: {len(unused_classes)}")
print("\nUnused Classes Sample:")
print(unused_classes[:50])
