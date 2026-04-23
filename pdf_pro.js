const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const mdContent = fs.readFileSync('rapport_direction.md', 'utf-8');
  const date = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary: #3b82f6;
            --primary-dark: #1e40af;
            --secondary: #475569;
            --text: #0f172a;
            --bg: #f8fafc;
            --border: #e2e8f0;
          }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Inter', sans-serif; 
            color: var(--text); 
            margin: 0; 
            padding: 0;
            background-color: #fff;
            -webkit-print-color-adjust: exact;
          }
          /* Cover Page */
          .cover {
            height: 1040px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 80px;
            page-break-after: always;
            position: relative;
          }
          .cover::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 12px;
            background: var(--primary);
          }
          .cover .logo-placeholder {
            width: 80px;
            height: 80px;
            background: var(--primary);
            color: white;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 40px;
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
          }
          .cover h1 {
            font-size: 56px;
            color: var(--primary-dark);
            margin: 0 0 16px 0;
            letter-spacing: -1.5px;
            font-weight: 800;
          }
          .cover h2 {
            font-size: 28px;
            color: var(--secondary);
            font-weight: 400;
            margin: 0 0 60px 0;
          }
          .cover .footer {
            position: absolute;
            bottom: 60px;
            font-size: 18px;
            color: #64748b;
            font-weight: 500;
          }
          
          /* Content Pages */
          .section {
            page-break-after: always;
            padding: 60px 80px;
            height: 1040px;
            position: relative;
          }
          .section:last-child {
            page-break-after: avoid;
          }
          /* Page Header */
          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--border);
          }
          .page-header .brand {
            font-weight: 700;
            color: var(--primary);
            font-size: 16px;
          }
          .page-header .date-small {
            color: #94a3b8;
            font-size: 14px;
          }
          .section-title {
            font-size: 32px;
            color: var(--primary-dark);
            margin: 0 0 24px 0;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .description {
            font-size: 17px;
            line-height: 1.7;
            color: var(--secondary);
            margin-bottom: 40px;
            background: var(--bg);
            padding: 24px 32px;
            border-left: 4px solid var(--primary);
            border-radius: 0 8px 8px 0;
          }
          .image-container {
            text-align: center;
            margin-top: 20px;
          }
          img { 
            max-width: 100%; 
            max-height: 550px;
            object-fit: contain;
            border: 1px solid var(--border); 
            border-radius: 12px; 
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); 
          }
          .page-footer {
            position: absolute;
            bottom: 40px;
            left: 80px;
            right: 80px;
            border-top: 1px solid var(--border);
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #cbd5e1;
          }
        </style>
      </head>
      <body>
        <div class="cover">
          <div class="logo-placeholder">A</div>
          <h1>Atelier360</h1>
          <h2>Rapport d'Avancement Exécutif</h2>
          <div class="footer">Édité le ${date}</div>
        </div>
  `;

  const sections = [];
  let currentSection = null;

  const lines = mdContent.split('\n');
  for (let line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) sections.push(currentSection);
      const title = line.substring(3).replace(/^\d+\.\s*/, '');
      currentSection = { title: title, desc: '', img: '' };
    } else if (currentSection && line.startsWith('<img')) {
      const match = line.match(/src="([^"]+)"/);
      if (match) {
        let imgPath = match[1];
        let cleanPath = imgPath.replace('file:///', '');
        // Puppeteer blocks local file:// paths in setContent. Convert to base64.
        try {
          const imgBase64 = fs.readFileSync(cleanPath, 'base64');
          currentSection.img = `data:image/png;base64,${imgBase64}`;
        } catch (err) {
          console.error('Erreur chargement image:', cleanPath, err.message);
        }
      }
    } else if (currentSection && line.trim().length > 0 && !line.startsWith('##') && !line.startsWith('<img') && !line.startsWith('---') && !line.startsWith('*')) {
      currentSection.desc += line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + ' ';
    }
  }
  if (currentSection) sections.push(currentSection);

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    htmlContent += `
      <div class="section">
        <div class="page-header">
          <div class="brand">Atelier360</div>
          <div class="date-small">Page ${i + 1} / ${sections.length}</div>
        </div>
        <h2 class="section-title">${sec.title}</h2>
        <div class="description">
          ${sec.desc}
        </div>
        ${sec.img ? `<div class="image-container"><img src="${sec.img}" /></div>` : ''}
        <div class="page-footer">Document interne - Confidentiel</div>
      </div>
    `;
  }

  htmlContent += `</body></html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  await page.pdf({ 
    path: 'rapport_direction_pro.pdf', 
    format: 'A4', 
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });

  await browser.close();
  console.log('Professional PDF generated!');
})();
