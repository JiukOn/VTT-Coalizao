import fs from 'fs';
import path from 'path';

const data = {
    auras: {
        chaos: { pt: "Caos", en: "Chaos" },
        harmony: { pt: "Harmonia", en: "Harmony" },
        inspiration: { pt: "Inspiração", en: "Inspiration" },
        revelation: { pt: "Revelação", en: "Revelation" },
        oppressor: { pt: "Opressor", en: "Oppressor" },
        disorder: { pt: "Desordem", en: "Disorder" }
    },
    personalities: {
        conscience: { pt: "Consciência", en: "Conscience" },
        zealous: { pt: "Zelo", en: "Zealous" },
        disenchantment: { pt: "Desencanto", en: "Disenchantment" },
        jubilation: { pt: "Júbilo", en: "Jubilation" },
        impetus: { pt: "Ímpeto", en: "Impetus" }
    },
    tendencies: {
        first_aid: { pt: "Primeiros Socorros", en: "First Aid" },
        firearms: { pt: "Armas de Fogo", en: "Firearms" },
        personal_defense: { pt: "Defesa Pessoal", en: "Personal Defense" },
        combat_tactics: { pt: "Táticas de Combate", en: "Combat Tactics" },
        medicine: { pt: "Medicina", en: "Medicine" },
        nerd: { pt: "Nerd", en: "Nerd" },
        instrument_creation: { pt: "Criação de Instrumentos", en: "Instrument Creation" },
        curse: { pt: "Amaldiçoar", en: "Curse" },
        linguistics: { pt: "Linguística", en: "Linguistics" },
        calculation: { pt: "Cálculo", en: "Calculation" },
        charm: { pt: "Lábia", en: "Charm" },
        fight: { pt: "Luta", en: "Fight" },
        sewing: { pt: "Costura", en: "Sewing" },
        cooking: { pt: "Cozinha", en: "Cooking" },
        mercantilism: { pt: "Mercantilismo", en: "Mercantilism" },
        spirituality: { pt: "Espiritualidade", en: "Spirituality" },
        parkour: { pt: "Parkour", en: "Parkour" },
        runic_language: { pt: "Linguagem Rúnica", en: "Runic Language" },
        botany: { pt: "Botânica", en: "Botany" },
        reading: { pt: "Leitura", en: "Reading" },
        history: { pt: "História", en: "History" },
        systems: { pt: "Sistemas", en: "Systems" },
        weapon_modification: { pt: "Modificações de Arma", en: "Weapon Modification" },
        strategy_creation: { pt: "Criação de Estratégias", en: "Strategy Creation" },
        sorcery: { pt: "Feitiçaria", en: "Sorcery" }
    }
};

Object.entries(data).forEach(([category, items]) => {
    const targetDir = path.join('database/infodata', category);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    Object.entries(items).forEach(([id, names]) => {
        const filePath = path.join(targetDir, `${id}.json`);
        const content = {
            id: id,
            name: {
                "pt-br": names.pt,
                "en-us": names.en
            },
            description: {
                "pt-br": "",
                "en-us": ""
            }
        };
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
        console.log(`Created ${filePath}`);
    });
});
