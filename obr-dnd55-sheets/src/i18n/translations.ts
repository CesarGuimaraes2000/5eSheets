import type { AbilityKey, Currency, ProficiencyLevel } from '../types/character';

export type Lang = 'en' | 'pt';

export interface Translations {
  common: {
    unnamed: string;
    unnamedHero: string;
    copySuffix: string;
    connectingObr: string;
    importJson: string;
    exportJson: string;
    export: string;
    newCharacter: string;
    newShort: string;
    duplicate: string;
    delete: string;
    add: string;
    remove: string;
    noneDash: string;
    invalidJson: string;
    notASheetJson: string;
    couldNotImport: string;
    levelLabel: (level: number) => string;
  };
  abilities: Record<AbilityKey, { label: string; abbr: string }>;
  skills: Record<string, string>;
  conditions: Record<string, string>;
  spellLevels: string[];
  currencies: Record<keyof Currency, string>;
  tabs: {
    core: string;
    lore: string;
    spells: string;
  };
  header: {
    characterName: string;
    autoCalculations: string;
    manualValues: string;
    classAndLevel: string;
    classAndLevelPh: string;
    background: string;
    backgroundPh: string;
    playerName: string;
    species: string;
    speciesPh: string;
    alignment: string;
    alignmentPh: string;
    experiencePoints: string;
  };
  shared: {
    calculatedAuto: (label: string) => string;
    manualTooltip: (label: string) => string;
    valueFallback: string;
    abilityModifier: (label: string) => string;
    abilityScore: (label: string) => string;
    proficiencyLabel: Record<ProficiencyLevel, string>;
    clickFor: (nextLabel: string) => string;
  };
  page1: {
    abilityScores: string;
    proficiency: string;
    proficiencyBonus: string;
    heroicInspiration: string;
    savingThrows: string;
    skills: string;
    skillsLegend: string;
    passiveWisdom: string;
    passivePerception: string;
    otherProficiencies: string;
    otherProficienciesPh: string;
    armorClass: string;
    initiative: string;
    speed: string;
    hitPoints: string;
    hpMax: string;
    hpCurrent: string;
    hpTemp: string;
    hpDecrease: string;
    hpIncrease: string;
    hitDice: string;
    hdTotal: string;
    hdRemaining: string;
    deathSaves: string;
    successes: string;
    success: string;
    failures: string;
    failure: string;
    conditions: string;
    exhaustion: string;
    attacksAndSpellcasting: string;
    noAttacks: string;
    atkName: string;
    atkBonus: string;
    atkDamage: string;
    atkNamePh: string;
    atkDamagePh: string;
    atkNotesPh: string;
    removeAttack: string;
    equipment: string;
    equipmentPh: string;
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    featuresAndTraits: string;
    featuresAndTraitsPh: string;
    autoCalcLabel: string;
    autoCalcHintOn: string;
    autoCalcHintOff: string;
  };
  page2: {
    imageUnavailable: string;
    pasteImageUrl: string;
    characterPortrait: string;
    orgSymbol: string;
    symbol: string;
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    appearance: string;
    imageUrlTable: string;
    appearancePh: string;
    alliesAndOrgs: string;
    orgName: string;
    symbolUrl: string;
    alliesPh: string;
    backstory: string;
    additionalFeatures: string;
    treasure: string;
  };
  page3: {
    spellcastingClass: string;
    spellcastingClassPh: string;
    spellcastingAbility: string;
    spellSaveDc: string;
    spellAttack: string;
    spellSaveDcTitle: string;
    spellAttackTitle: string;
    shareNoticeBefore: string;
    shareNoticeBold: string;
    shareNoticeAfter: string;
    addCantrip: string;
    addSpell: string;
    slots: string;
    totalSlots: string;
    expended: string;
    expendedSlot: string;
    noCantrips: string;
    noSpells: string;
    prepared: string;
    cantripPh: string;
    spellPh: string;
    concentration: string;
    ritual: string;
    removeSpell: string;
    castingTimePh: string;
    rangePh: string;
    notesPh: string;
  };
  editor: {
    title: string;
    subtitle: string;
    yourCharacters: string;
    noCharacters: string;
    obrExtension: string;
    obrInstallHint: string;
    exportTitle: string;
    confirmDelete: (name: string) => string;
    updatedFromFile: string;
    imported: string;
    autoSaveNote: string;
    heroTitle: string;
    heroSubtitle: string;
    step1Title: string;
    step1Text: string;
    step2Title: string;
    step2Text: string;
    step3Title: string;
    step3Text: string;
    manifestUrlLabel: string;
  };
  table: {
    partyTitle: string;
    gmBadge: string;
    storageFull: string;
    syncing: string;
    savedInRoom: string;
    storageTooltip: (kb: string) => string;
    backToTable: string;
    exportUpdatedTitle: string;
    sheetCreator: string;
    sheetCreatorTitle: string;
    createQuickTitle: string;
    linkingBanner: string;
    cancelLink: string;
    emptyTitle: string;
    emptyBeforeCreator: string;
    emptyCreatorBold: string;
    emptyMid: string;
    emptyImportBold: string;
    emptyAfterImport: string;
    openSheetCreator: string;
    partyCount: (count: number) => string;
    roomFullError: string;
    importedToTable: (name: string) => string;
    heroNameDefault: (playerName: string) => string;
    created: string;
    confirmRemove: (name: string) => string;
    removedFromRoom: (name: string) => string;
    tokenLinked: (name: string) => string;
    fallbackCharName: string;
    youBadge: string;
    armorClassTitle: string;
    hpAbbr: string;
    exhaustionBadge: (level: number) => string;
    linkToToken: string;
    playerLabel: string;
    unknownPlayer: string;
    viewOnly: string;
    fullSheetBtn: string;
    exportUpdatedTooltip: string;
    removeFromRoom: string;
    tileAc: string;
    tileInit: string;
    tileSpeed: string;
    tileProf: string;
    tilePassive: string;
    hitPoints: string;
    hpMaxLabel: string;
    tempSuffix: string;
    amountTitle: string;
    damage: string;
    heal: string;
    tempBtn: string;
    deathSaves: string;
    successes: string;
    successLabel: string;
    failures: string;
    failureLabel: string;
    hitDice: string;
    hitDiceRemaining: string;
    of: string;
    exhaustion: string;
    exhaustionLevel: string;
    conditions: string;
    noConditions: string;
    abilitiesAndSaves: string;
    savePrefix: string;
    savingThrowTitle: string;
    skills: string;
    attacks: string;
    noAttacks: string;
    spellcasting: string;
    dcLabel: string;
    atkLabel: string;
    slotUsedLabel: (level: number) => string;
    noPreparedSpells: string;
  };
}

const en: Translations = {
  common: {
    unnamed: 'Unnamed',
    unnamedHero: 'Unnamed Hero',
    copySuffix: 'copy',
    connectingObr: 'Connecting to Owlbear Rodeo...',
    importJson: 'Import JSON',
    exportJson: 'Export JSON',
    export: 'Export',
    newCharacter: 'New Character',
    newShort: 'New',
    duplicate: 'Duplicate',
    delete: 'Delete',
    add: 'Add',
    remove: 'Remove',
    noneDash: '—',
    invalidJson: 'The file is not valid JSON.',
    notASheetJson: 'This JSON is not a D&D 5.5 character sheet.',
    couldNotImport: 'Could not import file.',
    levelLabel: (level) => `Level ${level}`,
  },
  abilities: {
    strength: { label: 'Strength', abbr: 'STR' },
    dexterity: { label: 'Dexterity', abbr: 'DEX' },
    constitution: { label: 'Constitution', abbr: 'CON' },
    intelligence: { label: 'Intelligence', abbr: 'INT' },
    wisdom: { label: 'Wisdom', abbr: 'WIS' },
    charisma: { label: 'Charisma', abbr: 'CHA' },
  },
  skills: {
    acrobatics: 'Acrobatics',
    animalHandling: 'Animal Handling',
    arcana: 'Arcana',
    athletics: 'Athletics',
    deception: 'Deception',
    history: 'History',
    insight: 'Insight',
    intimidation: 'Intimidation',
    investigation: 'Investigation',
    medicine: 'Medicine',
    nature: 'Nature',
    perception: 'Perception',
    performance: 'Performance',
    persuasion: 'Persuasion',
    religion: 'Religion',
    sleightOfHand: 'Sleight of Hand',
    stealth: 'Stealth',
    survival: 'Survival',
  },
  conditions: {
    Blinded: 'Blinded',
    Charmed: 'Charmed',
    Deafened: 'Deafened',
    Frightened: 'Frightened',
    Grappled: 'Grappled',
    Incapacitated: 'Incapacitated',
    Invisible: 'Invisible',
    Paralyzed: 'Paralyzed',
    Petrified: 'Petrified',
    Poisoned: 'Poisoned',
    Prone: 'Prone',
    Restrained: 'Restrained',
    Stunned: 'Stunned',
    Unconscious: 'Unconscious',
    Concentrating: 'Concentrating',
  },
  spellLevels: [
    'Cantrips',
    '1st Level',
    '2nd Level',
    '3rd Level',
    '4th Level',
    '5th Level',
    '6th Level',
    '7th Level',
    '8th Level',
    '9th Level',
  ],
  currencies: { cp: 'CP', sp: 'SP', ep: 'EP', gp: 'GP', pp: 'PP' },
  tabs: {
    core: 'Core & Combat',
    lore: 'Details & Story',
    spells: 'Spells & Grimoire',
  },
  header: {
    characterName: 'Character Name',
    autoCalculations: 'Auto calculations',
    manualValues: 'Manual values',
    classAndLevel: 'Class & Level',
    classAndLevelPh: 'Fighter 5',
    background: 'Background',
    backgroundPh: 'Soldier',
    playerName: 'Player Name',
    species: 'Species',
    speciesPh: 'Human',
    alignment: 'Alignment',
    alignmentPh: 'Neutral Good',
    experiencePoints: 'Experience Points',
  },
  shared: {
    calculatedAuto: (label) => `${label}: calculated automatically`,
    manualTooltip: (label) => `${label} (manual)`,
    valueFallback: 'Value',
    abilityModifier: (label) => `${label} modifier`,
    abilityScore: (label) => `${label} score`,
    proficiencyLabel: {
      none: 'Not proficient',
      proficient: 'Proficient',
      expertise: 'Expertise',
    },
    clickFor: (nextLabel) => `click for ${nextLabel.toLowerCase()}`,
  },
  page1: {
    abilityScores: 'Ability Scores',
    proficiency: 'Proficiency',
    proficiencyBonus: 'Proficiency bonus',
    heroicInspiration: 'Heroic Inspiration',
    savingThrows: 'Saving Throws',
    skills: 'Skills',
    skillsLegend: '○ none · ● prof · ◉ expertise',
    passiveWisdom: 'Passive Wisdom (Perception)',
    passivePerception: 'Passive perception',
    otherProficiencies: 'Other Proficiencies & Languages',
    otherProficienciesPh: 'Armor, weapons, tools, languages...',
    armorClass: 'Armor Class',
    initiative: 'Initiative',
    speed: 'Speed',
    hitPoints: 'Hit Points',
    hpMax: 'Maximum',
    hpCurrent: 'Current',
    hpTemp: 'Temporary',
    hpDecrease: 'Decrease HP',
    hpIncrease: 'Increase HP',
    hitDice: 'Hit Dice',
    hdTotal: 'Total',
    hdRemaining: 'Remaining',
    deathSaves: 'Death Saves',
    successes: 'Successes',
    success: 'Success',
    failures: 'Failures',
    failure: 'Failure',
    conditions: 'Conditions',
    exhaustion: 'Exhaustion',
    attacksAndSpellcasting: 'Attacks & Spellcasting',
    noAttacks: 'No attacks yet.',
    atkName: 'Name',
    atkBonus: 'Atk',
    atkDamage: 'Damage / Type',
    atkNamePh: 'Longsword',
    atkDamagePh: '1d8+3 slashing',
    atkNotesPh: 'Notes / Weapon Mastery (Vex, Topple, Nick...)',
    removeAttack: 'Remove attack',
    equipment: 'Equipment',
    equipmentPh: 'Backpack, rope, rations...',
    traits: 'Personality Traits',
    ideals: 'Ideals',
    bonds: 'Bonds',
    flaws: 'Flaws',
    featuresAndTraits: 'Features & Traits',
    featuresAndTraitsPh: 'Class features, species traits, feats...',
    autoCalcLabel: 'Automatic calculations',
    autoCalcHintOn: 'Locked values are calculated from your scores. Turn this off in the header to edit them manually.',
    autoCalcHintOff: 'Manual mode: every calculated value can be edited freely.',
  },
  page2: {
    imageUnavailable: 'Image not available',
    pasteImageUrl: 'Paste an image URL',
    characterPortrait: 'Character portrait',
    orgSymbol: 'Organization symbol',
    symbol: 'Symbol',
    age: 'Age',
    height: 'Height',
    weight: 'Weight',
    eyes: 'Eyes',
    skin: 'Skin',
    hair: 'Hair',
    appearance: 'Character Appearance',
    imageUrlTable: 'Image URL (shown at the table)',
    appearancePh: 'Describe how your character looks...',
    alliesAndOrgs: 'Allies & Organizations',
    orgName: 'Name',
    symbolUrl: 'Symbol URL',
    alliesPh: 'Allies, factions, contacts...',
    backstory: 'Character Backstory',
    additionalFeatures: 'Additional Features & Traits',
    treasure: 'Treasure',
  },
  page3: {
    spellcastingClass: 'Spellcasting Class',
    spellcastingClassPh: 'Wizard',
    spellcastingAbility: 'Spellcasting Ability',
    spellSaveDc: 'Spell Save DC',
    spellAttack: 'Spell Attack',
    spellSaveDcTitle: 'Spell save DC',
    spellAttackTitle: 'Spell attack bonus',
    shareNoticeBefore: 'Cantrips and ',
    shareNoticeBold: 'prepared',
    shareNoticeAfter: ' spells (name, casting time, range, C/R) are shared with the table. Notes stay only in your sheet.',
    addCantrip: 'Add cantrip',
    addSpell: 'Add spell',
    slots: 'Slots',
    totalSlots: 'Total slots',
    expended: 'Expended',
    expendedSlot: 'Expended slot',
    noCantrips: 'No cantrips.',
    noSpells: 'No spells.',
    prepared: 'Prepared',
    cantripPh: 'Fire Bolt',
    spellPh: 'Spell name',
    concentration: 'Concentration',
    ritual: 'Ritual',
    removeSpell: 'Remove spell',
    castingTimePh: 'Casting time',
    rangePh: 'Range',
    notesPh: 'Notes (not shared)',
  },
  editor: {
    title: 'D&D 5.5 Character Sheets',
    subtitle: 'Full sheet editor · export JSON · import it at your Owlbear Rodeo table',
    yourCharacters: 'Your Characters',
    noCharacters: 'No characters yet.',
    obrExtension: 'Owlbear Rodeo extension',
    obrInstallHint: 'Add this URL in OBR → Extensions → Add:',
    exportTitle: 'Download this character as JSON (import it in Owlbear Rodeo)',
    confirmDelete: (name) => `Delete "${name}" from this browser?`,
    updatedFromFile: 'Character updated from file.',
    imported: 'Character imported.',
    autoSaveNote: 'Saved automatically in this browser · Export a JSON file to back it up or to use it in Owlbear Rodeo.',
    heroTitle: 'Forge your next hero',
    heroSubtitle: 'Complete character sheets for D&D 5.5 (2024) with automatic calculations you can override anytime.',
    step1Title: 'Create',
    step1Text: 'Fill in the full 3-page D&D 5.5 sheet. Saved in your browser.',
    step2Title: 'Export',
    step2Text: 'Download your character as a JSON file.',
    step3Title: 'Play',
    step3Text: 'Import it in the Owlbear Rodeo extension. Only the essentials are shared with the table.',
    manifestUrlLabel: 'Owlbear Rodeo manifest URL:',
  },
  table: {
    partyTitle: 'D&D 5.5 Party',
    gmBadge: 'GM',
    storageFull: 'Storage full',
    syncing: 'Syncing...',
    savedInRoom: 'Saved in room',
    storageTooltip: (kb) => `Room storage: ${kb} kB of 16 kB used (shared by all extensions in this room)`,
    backToTable: 'Back to Table View',
    exportUpdatedTitle: 'Export updated JSON',
    sheetCreator: 'Sheet Creator',
    sheetCreatorTitle: 'Open the full character creator in a new tab',
    createQuickTitle: 'Create a new sheet directly',
    linkingBanner: 'Choose a character to link to the selected token',
    cancelLink: 'Cancel token link',
    emptyTitle: 'No characters at the table yet',
    emptyBeforeCreator: 'Create your character in the ',
    emptyCreatorBold: 'Sheet Creator',
    emptyMid: ', export the JSON file, and click ',
    emptyImportBold: 'Import JSON',
    emptyAfterImport: ' above to share a compact summary with the room.',
    openSheetCreator: 'Open Sheet Creator',
    partyCount: (count) => `Party (${count})`,
    roomFullError: 'Room storage limit (16 kB) reached. Remove a character first.',
    importedToTable: (name) => `"${name}" imported to the table.`,
    heroNameDefault: (playerName) => `${playerName}'s Hero`,
    created: 'Character created.',
    confirmRemove: (name) => `Remove "${name}" from the room?`,
    removedFromRoom: (name) => `"${name}" removed from the room.`,
    tokenLinked: (name) => `Token linked to ${name}.`,
    fallbackCharName: 'character',
    youBadge: 'YOU',
    armorClassTitle: 'Armor Class',
    hpAbbr: 'HP',
    exhaustionBadge: (level) => `Exhaustion ${level}`,
    linkToToken: 'Link to token',
    playerLabel: 'Player:',
    unknownPlayer: 'Unknown',
    viewOnly: 'view only',
    fullSheetBtn: 'Full sheet',
    exportUpdatedTooltip: "Download the full sheet with this session's changes (HP, slots...)",
    removeFromRoom: 'Remove from room',
    tileAc: 'AC',
    tileInit: 'Init',
    tileSpeed: 'Speed',
    tileProf: 'Prof',
    tilePassive: 'Passive',
    hitPoints: 'Hit Points',
    hpMaxLabel: 'Max',
    tempSuffix: 'temp',
    amountTitle: 'Amount',
    damage: 'Damage',
    heal: 'Heal',
    tempBtn: 'Temp',
    deathSaves: 'Death Saves',
    successes: 'Successes',
    successLabel: 'Success',
    failures: 'Failures',
    failureLabel: 'Failure',
    hitDice: 'Hit Dice',
    hitDiceRemaining: 'Hit dice remaining',
    of: 'of',
    exhaustion: 'Exhaustion',
    exhaustionLevel: 'Exhaustion level',
    conditions: 'Conditions',
    noConditions: 'No conditions.',
    abilitiesAndSaves: 'Abilities & Saving Throws',
    savePrefix: 'Save',
    savingThrowTitle: 'Saving throw',
    skills: 'Skills',
    attacks: 'Attacks',
    noAttacks: 'No attacks.',
    spellcasting: 'Spellcasting',
    dcLabel: 'DC',
    atkLabel: 'Atk',
    slotUsedLabel: (level) => `Level ${level} slot used`,
    noPreparedSpells: 'No cantrips or prepared spells.',
  },
};

const pt: Translations = {
  common: {
    unnamed: 'Sem nome',
    unnamedHero: 'Herói Sem Nome',
    copySuffix: 'cópia',
    connectingObr: 'Conectando ao Owlbear Rodeo...',
    importJson: 'Importar JSON',
    exportJson: 'Exportar JSON',
    export: 'Exportar',
    newCharacter: 'Novo Personagem',
    newShort: 'Novo',
    duplicate: 'Duplicar',
    delete: 'Excluir',
    add: 'Adicionar',
    remove: 'Remover',
    noneDash: '—',
    invalidJson: 'O arquivo não é um JSON válido.',
    notASheetJson: 'Este JSON não é uma ficha de personagem D&D 5.5.',
    couldNotImport: 'Não foi possível importar o arquivo.',
    levelLabel: (level) => `Nível ${level}`,
  },
  abilities: {
    strength: { label: 'Força', abbr: 'FOR' },
    dexterity: { label: 'Destreza', abbr: 'DES' },
    constitution: { label: 'Constituição', abbr: 'CON' },
    intelligence: { label: 'Inteligência', abbr: 'INT' },
    wisdom: { label: 'Sabedoria', abbr: 'SAB' },
    charisma: { label: 'Carisma', abbr: 'CAR' },
  },
  skills: {
    acrobatics: 'Acrobacia',
    animalHandling: 'Adestrar Animais',
    arcana: 'Arcanismo',
    athletics: 'Atletismo',
    deception: 'Enganação',
    history: 'História',
    insight: 'Intuição',
    intimidation: 'Intimidação',
    investigation: 'Investigação',
    medicine: 'Medicina',
    nature: 'Natureza',
    perception: 'Percepção',
    performance: 'Atuação',
    persuasion: 'Persuasão',
    religion: 'Religião',
    sleightOfHand: 'Prestidigitação',
    stealth: 'Furtividade',
    survival: 'Sobrevivência',
  },
  conditions: {
    Blinded: 'Cego',
    Charmed: 'Enfeitiçado',
    Deafened: 'Surdo',
    Frightened: 'Amedrontado',
    Grappled: 'Agarrado',
    Incapacitated: 'Incapacitado',
    Invisible: 'Invisível',
    Paralyzed: 'Paralisado',
    Petrified: 'Petrificado',
    Poisoned: 'Envenenado',
    Prone: 'Caído',
    Restrained: 'Contido',
    Stunned: 'Atordoado',
    Unconscious: 'Inconsciente',
    Concentrating: 'Concentrando',
  },
  spellLevels: [
    'Truques',
    '1º Nível',
    '2º Nível',
    '3º Nível',
    '4º Nível',
    '5º Nível',
    '6º Nível',
    '7º Nível',
    '8º Nível',
    '9º Nível',
  ],
  currencies: { cp: 'PC', sp: 'PP', ep: 'PE', gp: 'PO', pp: 'PL' },
  tabs: {
    core: 'Principal & Combate',
    lore: 'Detalhes & História',
    spells: 'Magias & Grimório',
  },
  header: {
    characterName: 'Nome do Personagem',
    autoCalculations: 'Cálculos automáticos',
    manualValues: 'Valores manuais',
    classAndLevel: 'Classe e Nível',
    classAndLevelPh: 'Guerreiro 5',
    background: 'Antecedente',
    backgroundPh: 'Soldado',
    playerName: 'Nome do Jogador',
    species: 'Espécie',
    speciesPh: 'Humano',
    alignment: 'Tendência',
    alignmentPh: 'Neutro e Bom',
    experiencePoints: 'Pontos de Experiência',
  },
  shared: {
    calculatedAuto: (label) => `${label}: calculado automaticamente`,
    manualTooltip: (label) => `${label} (manual)`,
    valueFallback: 'Valor',
    abilityModifier: (label) => `Modificador de ${label}`,
    abilityScore: (label) => `Valor de ${label}`,
    proficiencyLabel: {
      none: 'Sem proficiência',
      proficient: 'Proficiente',
      expertise: 'Especialização',
    },
    clickFor: (nextLabel) => `clique para ${nextLabel.toLowerCase()}`,
  },
  page1: {
    abilityScores: 'Atributos',
    proficiency: 'Proficiência',
    proficiencyBonus: 'Bônus de proficiência',
    heroicInspiration: 'Inspiração Heroica',
    savingThrows: 'Testes de Resistência',
    skills: 'Perícias',
    skillsLegend: '○ nada · ● prof · ◉ espec.',
    passiveWisdom: 'Sabedoria Passiva (Percepção)',
    passivePerception: 'Percepção passiva',
    otherProficiencies: 'Outras Proficiências e Idiomas',
    otherProficienciesPh: 'Armaduras, armas, ferramentas, idiomas...',
    armorClass: 'Classe de Armadura',
    initiative: 'Iniciativa',
    speed: 'Deslocamento',
    hitPoints: 'Pontos de Vida',
    hpMax: 'Máximo',
    hpCurrent: 'Atual',
    hpTemp: 'Temporários',
    hpDecrease: 'Diminuir PV',
    hpIncrease: 'Aumentar PV',
    hitDice: 'Dados de Vida',
    hdTotal: 'Total',
    hdRemaining: 'Restantes',
    deathSaves: 'Testes contra Morte',
    successes: 'Sucessos',
    success: 'Sucesso',
    failures: 'Falhas',
    failure: 'Falha',
    conditions: 'Condições',
    exhaustion: 'Exaustão',
    attacksAndSpellcasting: 'Ataques e Conjuração',
    noAttacks: 'Nenhum ataque cadastrado.',
    atkName: 'Nome',
    atkBonus: 'Atq',
    atkDamage: 'Dano / Tipo',
    atkNamePh: 'Espada Longa',
    atkDamagePh: '1d8+3 cortante',
    atkNotesPh: 'Notas / Maestria de Arma (Vex, Topple, Nick...)',
    removeAttack: 'Remover ataque',
    equipment: 'Equipamento',
    equipmentPh: 'Mochila, corda, rações...',
    traits: 'Traços de Personalidade',
    ideals: 'Ideais',
    bonds: 'Vínculos',
    flaws: 'Defeitos',
    featuresAndTraits: 'Características e Talentos',
    featuresAndTraitsPh: 'Habilidades de classe, traços de espécie, talentos...',
    autoCalcLabel: 'Cálculos automáticos',
    autoCalcHintOn: 'Os valores com cadeado são calculados automaticamente. Desative no cabeçalho para editar manualmente.',
    autoCalcHintOff: 'Modo manual: todos os valores calculados podem ser editados livremente.',
  },
  page2: {
    imageUnavailable: 'Imagem indisponível',
    pasteImageUrl: 'Cole uma URL de imagem',
    characterPortrait: 'Retrato do personagem',
    orgSymbol: 'Símbolo da organização',
    symbol: 'Símbolo',
    age: 'Idade',
    height: 'Altura',
    weight: 'Peso',
    eyes: 'Olhos',
    skin: 'Pele',
    hair: 'Cabelo',
    appearance: 'Aparência do Personagem',
    imageUrlTable: 'URL da Imagem (exibida na mesa)',
    appearancePh: 'Descreva a aparência do personagem...',
    alliesAndOrgs: 'Aliados e Organizações',
    orgName: 'Nome',
    symbolUrl: 'URL do Símbolo',
    alliesPh: 'Aliados, facções, contatos...',
    backstory: 'História do Personagem',
    additionalFeatures: 'Características Adicionais',
    treasure: 'Tesouro',
  },
  page3: {
    spellcastingClass: 'Classe Conjuradora',
    spellcastingClassPh: 'Mago',
    spellcastingAbility: 'Atributo de Conjuração',
    spellSaveDc: 'CD de Magia',
    spellAttack: 'Ataque Mágico',
    spellSaveDcTitle: 'CD de resistência contra magia',
    spellAttackTitle: 'Bônus de ataque mágico',
    shareNoticeBefore: 'Truques e magias ',
    shareNoticeBold: 'preparadas',
    shareNoticeAfter: ' (nome, tempo de conjuração, alcance, C/R) são compartilhados com a mesa. Notas ficam só na sua ficha.',
    addCantrip: 'Adicionar truque',
    addSpell: 'Adicionar magia',
    slots: 'Espaços',
    totalSlots: 'Total de espaços',
    expended: 'Gastos',
    expendedSlot: 'Espaço gasto',
    noCantrips: 'Nenhum truque.',
    noSpells: 'Nenhuma magia.',
    prepared: 'Preparada',
    cantripPh: 'Raio de Fogo',
    spellPh: 'Nome da magia',
    concentration: 'Concentração',
    ritual: 'Ritual',
    removeSpell: 'Remover magia',
    castingTimePh: 'Tempo de conjuração',
    rangePh: 'Alcance',
    notesPh: 'Notas (não compartilhadas)',
  },
  editor: {
    title: 'Fichas de D&D 5.5',
    subtitle: 'Editor completo · exporte em JSON · importe na mesa do Owlbear Rodeo',
    yourCharacters: 'Seus Personagens',
    noCharacters: 'Nenhum personagem ainda.',
    obrExtension: 'Extensão Owlbear Rodeo',
    obrInstallHint: 'Adicione esta URL no OBR → Extensions → Add:',
    exportTitle: 'Baixar este personagem em JSON (importe no Owlbear Rodeo)',
    confirmDelete: (name) => `Excluir "${name}" deste navegador?`,
    updatedFromFile: 'Personagem atualizado pelo arquivo.',
    imported: 'Personagem importado.',
    autoSaveNote: 'Salvo automaticamente neste navegador · Exporte o arquivo JSON para backup ou para usar no Owlbear Rodeo.',
    heroTitle: 'Forje seu próximo herói',
    heroSubtitle: 'Fichas completas para D&D 5.5 (2024) com cálculos automáticos que podem ser ajustados manualmente.',
    step1Title: 'Crie',
    step1Text: 'Preencha a ficha completa de 3 páginas do D&D 5.5. Salvo no seu navegador.',
    step2Title: 'Exporte',
    step2Text: 'Baixe seu personagem como um arquivo JSON.',
    step3Title: 'Jogue',
    step3Text: 'Importe na extensão do Owlbear Rodeo. Apenas o essencial é compartilhado com a mesa.',
    manifestUrlLabel: 'URL do manifesto para o Owlbear Rodeo:',
  },
  table: {
    partyTitle: 'Grupo D&D 5.5',
    gmBadge: 'GM',
    storageFull: 'Armazenamento cheio',
    syncing: 'Sincronizando...',
    savedInRoom: 'Salvo na sala',
    storageTooltip: (kb) => `Armazenamento da sala: ${kb} kB de 16 kB usados (compartilhado por todas as extensões)`,
    backToTable: 'Voltar à Mesa',
    exportUpdatedTitle: 'Exportar JSON atualizado',
    sheetCreator: 'Criador de Fichas',
    sheetCreatorTitle: 'Abrir o criador de fichas completo em uma nova aba',
    createQuickTitle: 'Criar uma nova ficha diretamente',
    linkingBanner: 'Escolha um personagem para vincular ao token selecionado',
    cancelLink: 'Cancelar vínculo',
    emptyTitle: 'Nenhum personagem na mesa ainda',
    emptyBeforeCreator: 'Crie seu personagem no ',
    emptyCreatorBold: 'Criador de Fichas',
    emptyMid: ', exporte o arquivo JSON e clique em ',
    emptyImportBold: 'Importar JSON',
    emptyAfterImport: ' acima para compartilhar um resumo compacto com a sala.',
    openSheetCreator: 'Abrir Criador de Fichas',
    partyCount: (count) => `Grupo (${count})`,
    roomFullError: 'Limite da sala (16 kB) atingido. Remova um personagem primeiro.',
    importedToTable: (name) => `"${name}" importado para a mesa.`,
    heroNameDefault: (playerName) => `Herói de ${playerName}`,
    created: 'Personagem criado.',
    confirmRemove: (name) => `Remover "${name}" da sala?`,
    removedFromRoom: (name) => `"${name}" removido da sala.`,
    tokenLinked: (name) => `Token vinculado a ${name}.`,
    fallbackCharName: 'personagem',
    youBadge: 'VOCÊ',
    armorClassTitle: 'Classe de Armadura',
    hpAbbr: 'PV',
    exhaustionBadge: (level) => `Exaustão ${level}`,
    linkToToken: 'Vincular ao token',
    playerLabel: 'Jogador:',
    unknownPlayer: 'Desconhecido',
    viewOnly: 'somente leitura',
    fullSheetBtn: 'Ficha completa',
    exportUpdatedTooltip: 'Baixar a ficha completa com as alterações desta sessão (PV, espaços...)',
    removeFromRoom: 'Remover da sala',
    tileAc: 'CA',
    tileInit: 'Inic',
    tileSpeed: 'Desl.',
    tileProf: 'Prof',
    tilePassive: 'Passiva',
    hitPoints: 'Pontos de Vida',
    hpMaxLabel: 'Máx',
    tempSuffix: 'temp',
    amountTitle: 'Valor',
    damage: 'Dano',
    heal: 'Curar',
    tempBtn: 'Temp',
    deathSaves: 'Testes contra Morte',
    successes: 'Sucessos',
    successLabel: 'Sucesso',
    failures: 'Falhas',
    failureLabel: 'Falha',
    hitDice: 'Dados de Vida',
    hitDiceRemaining: 'Dados de vida restantes',
    of: 'de',
    exhaustion: 'Exaustão',
    exhaustionLevel: 'Nível de exaustão',
    conditions: 'Condições',
    noConditions: 'Nenhuma condição.',
    abilitiesAndSaves: 'Atributos e Resistências',
    savePrefix: 'Resist.',
    savingThrowTitle: 'Teste de resistência',
    skills: 'Perícias',
    attacks: 'Ataques',
    noAttacks: 'Nenhum ataque.',
    spellcasting: 'Conjuração',
    dcLabel: 'CD',
    atkLabel: 'Atq',
    slotUsedLabel: (level) => `Espaço de nível ${level} gasto`,
    noPreparedSpells: 'Nenhum truque ou magia preparada.',
  },
};

export const DICTIONARIES: Record<Lang, Translations> = { en, pt };
