// Conventional Commits (https://www.conventionalcommits.org/)
// Un préfixe d'aire optionnel est toléré en tête de sujet, ex. "[backend] ",
// car il peut être ajouté automatiquement avant le message conventionnel.
export default {
  extends: ['@commitlint/config-conventional'],
  // Retire le préfixe "[xxx] " avant d'appliquer les règles conventionnelles.
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?:\[[^\]]+\]\s*)*(\w+)(?:\(([^)]+)\))?!?: (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'subject-case': [0], // tolère majuscule/minuscule au début du sujet
  },
};
