import fs from 'fs';
import path from 'path';

const classesMapping = JSON.parse(fs.readFileSync('scratch/classes_mapping.json', 'utf8'));
const targetDir = 'database/infodata/classes';

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

Object.entries(classesMapping).forEach(([ptId, enId]) => {
    const filePath = path.join(targetDir, `${enId}.json`);
    
    // We don't want to overwrite unclassified.json if it already exists and is correct
    if (enId === 'unclassified' && fs.existsSync(filePath)) return;

    const namePt = ptId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const nameEn = enId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const classData = {
        id: enId,
        name: {
            "pt-br": namePt,
            "en-us": nameEn
        },
        description: {
            "pt-br": "",
            "en-us": ""
        },
        legacyAbility_id: null,
        multipliers: {
            vit: 1, dex: 1, crm: 1, frc: 1, int: 1, res: 1, pre: 1, enr: 1
        },
        have_skills: false,
        evolved_class: {
            isevolved: false,
            class_base_id: []
        }
    };

    fs.writeFileSync(filePath, JSON.stringify(classData, null, 2) + '\n', 'utf-8');
    console.log(`Created ${filePath}`);
});
