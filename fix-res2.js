const fs = require('fs');
const path = require('path');
const controllersDir = path.join(__dirname, 'src', 'controllers');

const filesToFix = ['details.controller.js', 'embed.controller.js', 'episodes.controller.js', 'search.controller.js', 'type.controller.js'];

for (const file of filesToFix) {
    const p = path.join(controllersDir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace res.status(200).json(...)
    content = content.replace(/res\.status\(200\)\.json\(/g, 'return c.json(');
    
    // Fix episodes controller parsing
    if (file === 'episodes.controller.js') {
        content = content.replace('const seasonNum = parseInt(season, 10);', "const seasonNum = parseInt(season.toString().replace(/\\D/g, ''), 10) || parseInt(season, 10);");
    }

    fs.writeFileSync(p, content);
}

console.log('Fixed res usages!');
