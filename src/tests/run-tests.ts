import { runCombatTests } from './combat.test';
import { runEnemyAITests } from './enemyAI.test';
import { runGameFlowTests } from './gameFlow.test';
import { runMapGeneratorTests } from './mapGenerator.test';
import { runSaveTests } from './save.test';

const tests = [
  ['combat', runCombatTests],
  ['enemyAI', runEnemyAITests],
  ['gameFlow', runGameFlowTests],
  ['mapGenerator', runMapGeneratorTests],
  ['save', runSaveTests],
] as const;

for (const [name, run] of tests) {
  run();
  console.log(`ok ${name}`);
}

console.log(`${tests.length} test groups passed`);
