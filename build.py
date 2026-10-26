"""Assemble src/ en un seul fichier index.html (le jeu publié sur GitHub Pages)."""
import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
shell = (src / 'shell.html').read_text()
css = (src / 'inner.css').read_text()
parts = sorted(p for p in src.glob('[0-9][0-9]_*.js'))
js = '\n'.join(p.read_text() for p in parts)
out = shell.replace('INNER_CSS', css).replace('/*__ALL__*/', js)
(root / 'index.html').write_text(out)
print('index.html', len(out), 'octets,', len(parts), 'fichiers JS')
