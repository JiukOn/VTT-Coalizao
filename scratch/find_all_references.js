import fs from 'fs';
import path from 'path';

const baseDir = 'database/infodata';
const uniqueValues = {};

const referenceKeys = [
    'aura_id',
    'class_id',
    'location_id',
    'modification_id',
    'personality_id',
    'specie1_id',
    'specie2_id',
    'tendencies_id',
    'legacyAbility_id',
    'evolved_class'
];

function collectValues(val, keyPath) {
    if (typeof val === 'string' && val !== "") {
        if (!uniqueValues[keyPath]) uniqueValues[keyPath] = new Set();
        uniqueValues[keyPath].add(val);
    } else if (Array.isArray(val)) {
        val.forEach(v => collectValues(v, keyPath));
    } else if (val !== null && typeof val === 'object') {
        for (const [k, v] of Object.entries(val)) {
            // If the key itself is a number, we treat it as an array-like structure
            const subPath = isNaN(k) ? `${keyPath}.${k}` : keyPath;
            collectValues(v, subPath);
        }
    }
}

function processFile(filePath) {
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        referenceKeys.forEach(key => {
            if (content[key]) {
                collectValues(content[key], key);
            }
        });

        if (content.equipament_id) collectValues(content.equipament_id, 'equipament_id');
        if (content.habilities_id) collectValues(content.habilities_id, 'habilities_id');
        if (content.inventory_id) collectValues(content.inventory_id, 'inventory_id');
        if (content.item_drops) collectValues(content.item_drops, 'item_drops');
    } catch { /* ignore malformed JSON */ }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.json')) {
            processFile(fullPath);
        }
    }
}

walk(baseDir);

const output = {};
for (const [key, values] of Object.entries(uniqueValues)) {
    output[key] = Array.from(values).sort();
}

console.log(JSON.stringify(output, null, 2));
