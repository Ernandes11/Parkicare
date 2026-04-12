import os
import re
from pathlib import Path

js_dir = Path('static/js')

for js_file in js_dir.glob('*.js'):
    content = js_file.read_text('utf-8')
    
    # Atualizar URLs de API
    content = content.replace('http://127.0.0.1:5000/api/', '/api/')
    content = content.replace('http://localhost:5000/api/', '/api/')
    
    # Atualizar redirecionamentos
    content = content.replace("window.location.href = \"telainicial.html\"", "window.location.href = \"/inicial\"")
    content = content.replace("window.location.href = \"telalogin.html\"", "window.location.href = \"/login\"")
    content = content.replace("window.location.href = 'telainicial.html'", "window.location.href = '/inicial'")
    content = content.replace("window.location.href = 'telalogin.html'", "window.location.href = '/login'")
    
    js_file.write_text(content, 'utf-8')
    print(f'✓ Atualizado: {js_file.name}')

print('\n✓ Todos os arquivos JS foram atualizados!')
