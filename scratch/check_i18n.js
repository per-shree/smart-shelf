
import fs from 'fs';

const content = fs.readFileSync('c:/Users/shree/Downloads/smart-refrigerator-management/src/i18n.ts', 'utf8');

const checkDuplicates = (section, startMarker, endMarker) => {
    const start = content.indexOf(startMarker);
    const end = content.indexOf(endMarker, start);
    const text = content.substring(start, end);
    const lines = text.split('\n');
    const keys = [];
    lines.forEach(line => {
        const match = line.match(/"([^"]+)":/);
        if (match) {
            const key = match[1];
            if (keys.includes(key)) {
                console.log(`Duplicate key in ${section}: ${key}`);
            }
            keys.push(key);
        }
    });
};

console.log('Checking for duplicates...');
checkDuplicates('English', 'en: {', '},');
checkDuplicates('Hindi', 'hi: {', '},');
checkDuplicates('Marathi', 'mr: {', '},');
