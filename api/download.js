export default async function handler(req, res) {
  const type = (req.query?.type || 'setup').toLowerCase();
  
  const releaseBase = 'https://github.com/narendraborhade-creator/Ageis-scanner/releases/download/v1.0.0';
  
  const targetUrl = type === 'portable'
    ? `${releaseBase}/Aegis-3D-Safe-Browser-1.0.0.exe`
    : `${releaseBase}/Aegis-3D-Safe-Browser-Setup-1.0.0.exe`;

  const fileName = type === 'portable'
    ? 'Aegis-3D-Safe-Browser-Portable.exe'
    : 'Aegis-3D-Safe-Browser-Setup.exe';

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.redirect(302, targetUrl);
}
