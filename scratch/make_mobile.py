import os
import re

css_dir = "static/css"
files = [
    "configs.css",
    "telacadastro.css",
    "telaininicial.css",
    "teste.tremores.css",
    "telaprimeira.css",
    "telaproxima.css"
]

for filename in files:
    filepath = os.path.join(css_dir, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the main container classes and enforce mobile max-width
    # .container, .configs-wrapper, etc
    
    if filename == "configs.css":
        new_content = re.sub(r'(\.configs-wrapper\s*\{[^}]*?)max-width:\s*\d+px;', r'\1max-width: 414px;', content, flags=re.DOTALL)
    elif filename in ["telacadastro.css", "telaininicial.css", "teste.tremores.css", "telaprimeira.css", "telaproxima.css"]:
        new_content = re.sub(r'(\.container\s*\{[^}]*?)max-width:\s*\d+px;', r'\1max-width: 414px;', content, flags=re.DOTALL)
    else:
        new_content = content
        
    # Also inject min-height if we are modifying container/wrapper
    if ".container" in new_content and filename != "configs.css":
        # Simple injection if not present
        if "min-height: 100vh" not in new_content:
            new_content = re.sub(r'(\.container\s*\{)', r'\1\n  min-height: 100vh;\n  box-shadow: 0 0 20px rgba(0,0,0,0.05);', new_content)
    elif filename == "configs.css":
        if "min-height: 100vh" not in new_content:
            new_content = re.sub(r'(\.configs-wrapper\s*\{)', r'\1\n  min-height: 100vh;\n  box-shadow: 0 0 20px rgba(0,0,0,0.05);', new_content)

    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filename}")
