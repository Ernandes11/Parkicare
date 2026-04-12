import os
import re
from pathlib import Path

templates_dir = Path('templates')

for html_file in templates_dir.glob('*.html'):
    content = html_file.read_text('utf-8')
    
    # Atualizar CSS
    content = re.sub(r'href=["\'](?!/)([^"\']*\.css)', r'href="/static/css/\1', content)
    
    # Atualizar JS
    content = re.sub(r'src=["\'](?!/)([^"\']*\.js)', r'src="/static/js/\1', content)
    
    # Atualizar imagens (png, jpg, mp3, etc)
    content = re.sub(r'src=["\'](?!/)([^"\']*\.(png|jpg|jpeg|gif|mp3))', r'src="/static/img/\1', content)
    
    # Atualizar links de navegação HTML
    content = content.replace('href="telalogin.html"', 'href="/login"')
    content = content.replace('href="telacadastro.html"', 'href="/cadastro"')
    content = content.replace('href="telainicial.html"', 'href="/inicial"')
    content = content.replace('href="telamedicamento.html"', 'href="/medicamentos"')
    content = content.replace('href="configs.html"', 'href="/configs"')
    content = content.replace('href="teste.tremores.html"', 'href="/tremores"')
    content = content.replace('href="telaprimeira.html"', 'href="/primeira"')
    content = content.replace('href="telaproxima.html"', 'href="/proxima"')
    
    # Atualizar funções onclick
    content = content.replace("onclick=\"window.location.href='telalogin.html'\"", "onclick=\"window.location.href='/login'\"")
    content = content.replace("onclick=\"window.location.href='telainicial.html'\"", "onclick=\"window.location.href='/inicial'\"")
    content = content.replace("onclick=\"window.location.href='configs.html'\"", "onclick=\"window.location.href='/configs'\"")
    content = content.replace("onclick=\"irPara('telalogin.html')\"", "onclick=\"irPara('/login')\"")
    content = content.replace("onclick=\"irPara('telacadastro.html')\"", "onclick=\"irPara('/cadastro')\"")
    content = content.replace("onclick=\"irPara('telamedicamento.html')\"", "onclick=\"irPara('/medicamentos')\"")
    content = content.replace("onclick=\"irPara('teste.tremores.html')\"", "onclick=\"irPara('/tremores')\"")
    content = content.replace("onclick=\"irPara('telaprimeira.html')\"", "onclick=\"irPara('/primeira')\"")
    content = content.replace("onclick=\"irPara('telaproxima.html')\"", "onclick=\"irPara('/proxima')\"")
    content = content.replace("onclick=\"irPara('configs.html')\"", "onclick=\"irPara('/configs')\"")
    
    html_file.write_text(content, 'utf-8')
    print(f'✓ Atualizado: {html_file.name}')

print('\n✓ Todos os arquivos HTML foram atualizados!')
