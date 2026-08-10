const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if (!file.includes('node_modules') && !file.includes('dist')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('d:\\Dowloads\\cinema\\cinema\\phim\\src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace single/double quoted string concatenations or simple strings
    content = content.replace(/['"]http:\/\/localhost:8080\/api([^'"]*)['"]/g, '`${import.meta.env.VITE_API_URL}$1`');
    
    // Replace already inside template literals
    content = content.replace(/http:\/\/localhost:8080\/api/g, '${import.meta.env.VITE_API_URL}');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log('Updated:', file);
    }
});
console.log('Total files changed:', changedFiles);
