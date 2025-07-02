#!/usr/bin/env node
const { execSync } = require('child_process');
const fs           = require('fs-extra');
const os           = require('os');
const path         = require('path');

const platform = os.platform();

if (platform === 'win32') {
  // Windows: add %JAVA_HOME%\bin to the user PATH via setx
  try {
    const currentPath = process.env.Path || '';
    const entry       = '%JAVA_HOME%\\bin';

    if (currentPath.toLowerCase().includes(entry.toLowerCase())) {
      console.log(`${entry} is already in your PATH, skipping.`);
    } else {
      execSync(`setx Path "${currentPath};${entry}"`, { stdio: 'inherit' });
      console.log(`✔️  Added ${entry} to your user PATH.`);
      console.log('⚠️  You may need to restart your terminal or log out and log back in for changes to apply.');
    }
  } catch (err) {
    console.warn('❌  Failed to update PATH:', err.message);
    console.warn('   Please run as Administrator:');
    console.warn('     setx Path "%Path%;%JAVA_HOME%\\bin"');
  }

} else {
  // macOS/Linux: append export to the user’s shell profile
  const home       = os.homedir();
  const shell      = process.env.SHELL || '';
  let   rcFileName = '.bashrc';

  if (shell.includes('zsh')) {
    rcFileName = '.zshrc';
  } else if (shell.includes('bash')) {
    rcFileName = '.bashrc';
  } else if (shell.includes('fish')) {
    rcFileName = '.config/fish/config.fish';
  }

  const rcPath = path.join(home, rcFileName);
  const line   = '\n# added by jvm postinstall\nexport PATH="$JAVA_HOME/bin:$PATH"\n';

  try {
    // Ensure the file exists
    await fs.ensureFile(rcPath);
    const content = await fs.readFile(rcPath, 'utf8');

    if (content.includes('export PATH="$JAVA_HOME/bin:$PATH"')) {
      console.log(`✔️  $JAVA_HOME/bin is already exported in ~/${rcFileName}, skipping.`);
    } else {
      await fs.appendFile(rcPath, line, 'utf8');
      console.log(`✔️  Appended 'export PATH="$JAVA_HOME/bin:$PATH"' to ~/${rcFileName}.`);
      console.log('⚠️  Restart your terminal or source your profile to apply the change:');
      console.log(`    source ~/${rcFileName}`);
    }
  } catch (err) {
    console.warn(`❌  Could not update ~/${rcFileName}:`, err.message);
    console.warn('   Please add the following line to your shell profile manually:');
    console.warn(line.trim());
  }
}
