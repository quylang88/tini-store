import fs from 'fs';

function fixExportUsageInstructions() {
  let content = fs.readFileSync('src/utils/file/fileUtils.js', 'utf8');

  // Fix array issue
  content = content.replace('const htmlContent = await generateUsageInstructionsHTMLContent(exportData);', 'const htmlContent = await generateUsageInstructionsHTMLContent(exportData[0]);');

  fs.writeFileSync('src/utils/file/fileUtils.js', content, 'utf8');
}

fixExportUsageInstructions();
