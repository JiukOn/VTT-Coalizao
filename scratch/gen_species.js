import fs from 'fs';
import path from 'path';

const speciesData = JSON.parse(fs.readFileSync('scratch/species_data.json', 'utf8'));
const targetDir = 'database/infodata/species';

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

speciesData.forEach(specie => {
    const filePath = path.join(targetDir, `${specie.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(specie, null, 2) + '\n', 'utf-8');
    console.log(`Created ${filePath}`);
});
