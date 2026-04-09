const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('dist/index.html not found — skipping postbuild.');
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Power Apps CDN requires SAS tokens on asset URLs.
// The token is injected at runtime by the platform as a query param on index.html.
// This script rewrites asset URLs so they also receive the SAS token dynamically.
html = html.replace(
  /<\/head>/,
  `<script>
(function(){
  var sas = location.search || '';
  if (!sas) return;
  document.querySelectorAll('link[href],script[src]').forEach(function(el){
    var attr = el.hasAttribute('href') ? 'href' : 'src';
    var val = el.getAttribute(attr);
    if (val && !val.startsWith('http') && !val.includes('?')) {
      el.setAttribute(attr, val + sas);
    }
  });
})();
</script>
</head>`
);

fs.writeFileSync(indexPath, html);
console.log('postbuild: SAS token rewrite injected into dist/index.html');
