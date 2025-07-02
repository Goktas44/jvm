#!/usr/bin/env node
const { execSync } = require('child_process');
const os = require('os');

if (process.platform === 'win32') {
  try {
    // Windows: kullanıcı PATH'ine append et
    // process.env.Path, o anki shell PATH'ini verir
    const currentPath = process.env.Path || '';
    const entry = '%JAVA_HOME%\\bin';

    if (currentPath.toLowerCase().includes(entry.toLowerCase())) {
      console.log(`%JAVA_HOME%\\bin already in PATH, skipping.`);
    } else {
      // setx ile güncelle (kullanıcı düzeyinde, yeni oturumlarda geçerli)
      execSync(`setx Path "${currentPath};${entry}"`, { stdio: 'inherit' });
      console.log(`✔️  Added ${entry} to your user PATH.`);
      console.log('⚠️  Yeni PATH ayarları için oturumu kapatıp yeniden açın.');
    }
  } catch (err) {
    console.warn('❌  PATH güncellenemedi:', err.message);
    console.warn('   Lütfen aşağıdaki komutu Yönetici olarak çalıştırın:');
    console.warn(`   setx Path "%Path%;%JAVA_HOME%\\bin"`);
  }
} else {
  // Unix’te genellikle ~/.bashrc veya ~/.zshrc’ye eklemek daha güvenli
  console.log('Postinstall: Windows dışı sistem, PATH değişikliği yapılmıyor.');
}
