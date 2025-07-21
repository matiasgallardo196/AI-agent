import { execSync } from 'child_process';

function run(command: string) {
  console.log(`🚀 Ejecutando: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  try {
    run('npx prisma db push --force-reset');
    run('ts-node scripts/seedExcelSample.ts');
    run('ts-node scripts/generateEmbeddings.ts');

    console.log('✅ Setup completo.');
  } catch (error) {
    console.error('❌ Error durante el setup:', error);
    process.exit(1);
  }
}

main();
