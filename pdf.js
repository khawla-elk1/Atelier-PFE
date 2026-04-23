const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const mdContent = fs.readFileSync('rapport_direction.md', 'utf-8');
  // Simple MD to HTML conversion
  let htmlContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1, h2, h3 { color: #333; }
          img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
  `;

  // Parse sections
  const lines = mdContent.split('\n');
  for (let line of lines) {
    if (line.startsWith('# ')) {
      htmlContent += `<h1>${line.substring(2)}</h1>`;
    } else if (line.startsWith('## ')) {
      // Add page break before H2 to make it clean
      htmlContent += `<div class="page-break"></div><h2>${line.substring(3)}</h2>`;
    } else if (line.startsWith('<img')) {
      htmlContent += line + '<br/>';
    } else if (line.startsWith('---')) {
      htmlContent += '<hr/>';
    } else if (line.startsWith('*')) {
      htmlContent += `<em>${line.replace(/\*/g, '')}</em><br/>`;
    } else if (line.trim().length > 0) {
      htmlContent += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
    }
  }

  htmlContent += `</body></html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({ path: 'rapport_direction.pdf', format: 'A4', printBackground: true });

  await browser.close();
  console.log('PDF generated!');
})();
