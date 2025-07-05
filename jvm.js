#!/usr/bin/env node

const { Command } = require("commander");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const semver = require("semver");
const axios = require("axios");
const tar = require("tar");
const extract = require("extract-zip");
const { execSync } = require("child_process");
const { dir } = require("console");
const { version: cliVersion } = require("./package.json");
const inquirer    = require('inquirer');
const cliProgress = require("cli-progress");

const program = new Command();
program
  .name("jvm")
  .description("Simple Java version manager")
  .version("1.0.0", "-V, --version", "Show CLI version")
  .usage("<command> [options]");

const JVM_HOME = path.join(os.homedir(), ".jvm");

const VERSIONS = path.join(JVM_HOME, "versions");

// -------------------- VERSION / V -------------------
program
  .command("version")
  .alias("v")
  .description("Show jvm CLI version")
  .action(() => {
    console.log(cliVersion);
  });

// -------------------- LIST / LS --------------------
program
  .command("list")
  .alias("ls")
  .description("List installed JDK versions")
  .option("-v, --verbose", "Also show the installation path")
  .action(async (opts) => {
    if (!(await fs.pathExists(VERSIONS))) {
      console.log("No versions installed yet.");
      return;
    }

    let currentVersion = null;
    const currentLink = path.join(JVM_HOME, "current");
    if (await fs.pathExists(currentLink)) {
      try {
        const realPath = await fs.realpath(currentLink);
        currentVersion = path.basename(realPath);
      } catch {}
    }

    const entries = await fs.readdir(VERSIONS);
    const dirs = entries.filter((name) =>
      fs.statSync(path.join(VERSIONS, name)).isDirectory()
    );

    if (dirs.length === 0) {
      console.log("No versions installed yet.");
      return;
    }

    dirs.forEach((name) => {
      const isCurrent = name === currentVersion;
      const marker = isCurrent ? "* " : "  ";
      let line = `${marker}${name}`;

      if (opts.verbose) {
        line += `  (path: ${path.join(VERSIONS, name)})`;
      }
      if (isCurrent) {
        line += "  (Currently using 64-bit executable)";
      }
      console.log(line);
    });
  });

// -------------------- USE / U --------------------

program
  .command("use <version>")
  .alias("u")
  .description("Switch active JDK version (e.g. 17, 17.0, 17.0.2+8)")
  .action(async (version) => {
    try {
      await fs.ensureDir(JVM_HOME);
      await fs.ensureDir(VERSIONS);

      const entries = await fs.readdir(VERSIONS);
      const dirs = entries.filter((name) =>
        fs.statSync(path.join(VERSIONS, name)).isDirectory()
      );

      if (dirs.length === 0) {
        console.error("No versions installed yet.");
        process.exit(1);
      }

      let target;
      if (dirs.includes(version)) {
        target = version;
      } else {
        const prefixMatches = dirs.filter((name) =>
          name.startsWith("jdk-" + version)
        );

        if (prefixMatches.length === 1) {
          target = prefixMatches[0];
        } else {
          target = semver.maxSatisfying(dirs, version, {
            includePrerelease: true,
          });
        }
      }

      if (!target) {
        console.error(`Version not found: ${version}`);
        process.exit(1);
      }

      const targetPath = path.join(VERSIONS, target);
      const currentLink = path.join(JVM_HOME, "current");

      await fs.remove(currentLink);
      const type = process.platform === "win32" ? "junction" : "dir";
      await fs.ensureSymlink(targetPath, currentLink, type);
      const cmd = `setx /M JAVA_HOME "${targetPath}"`;
      const elevateCmd = `powershell -Command "Start-Process cmd -ArgumentList '/c ${cmd}' -Verb RunAs"`;

      if (process.platform === "win32") {
        try {
          //  execSync(`setx /M Path "%JAVA_HOME%\\bin;%PATH%"`, { stdio: 'inherit' })
          execSync(elevateCmd, { stdio: "inherit" });
          console.log(`✔️  JAVA_HOME set to ${targetPath} (machine-wide)`);
        } catch (err) {
          console.error(
            "❌  Failed to run setx (run CMD as Administrator):",
            err.message
          );
        }
      } else {
        console.log(`export JAVA_HOME="${currentLink}"`);
      }
    } catch (err) {
      console.error("Error in use command:", err.message);
      process.exit(1);
    }
  });

// -------------------- INSTALL / I --------------------
program
  .command('install [version] [vendor]')
  .alias('i')
  .description('Install JDK; default version=17, prompts for vendor if not provided')
  .action(async (version = '17', vendor) => {
    try {
      // Normalize version (strip leading "jdk-" if present)
      version = version.replace(/^jdk-/, '');

      // Available JDK distributions
      const vendors = [
        { name: 'Oracle',   value: 'oracle'   },
        { name: 'Temurin',  value: 'temurin'  },
        { name: 'Corretto', value: 'corretto' },
        { name: 'Liberica', value: 'liberica' }
      ];

      // If vendor not provided or invalid, prompt the user
      if (!vendor || !vendors.some(v => v.value === vendor.toLowerCase())) {
        const answer = await inquirer.prompt([{
          type: 'list',
          name: 'vendor',
          message: 'Which JDK distribution would you like to install? (Press Ctrl + C to exit.)',
          choices: vendors
        }]);
        vendor = answer.vendor;
      }

      console.log(`> Installing jdk-${version} from ${vendor}`);

      // Prepare downloadInfo based on chosen vendor
      let downloadInfo;
      if (vendor === 'oracle') {
        const arch = process.platform === 'win32'
          ? 'windows-x64'
          : process.platform === 'darwin'
            ? 'macos-x64'
            : 'linux-x64';
        const ext = process.platform === 'win32' ? 'zip' : 'tar.gz';
        const latestUrl  = `https://download.oracle.com/java/${version}/latest/jdk-${version}_${arch}_bin.${ext}`;
        const archiveUrl = `https://download.oracle.com/java/${version}/archive/jdk-${version}_${arch}_bin.${ext}`;
        let url = latestUrl;
        try {
          // Check if "latest" exists; if not, fall back to "archive"
          await axios.head(latestUrl, { headers: { 'Cookie': 'oraclelicense=accept-securebackup-cookie' } });
        } catch {
          url = archiveUrl;
        }
        downloadInfo = { url, type: ext === 'zip' ? 'zip' : 'tgz', cookie: true };

      } else if (vendor === 'temurin') {
        const major = semver.major(version);
        const apiUrl = `https://api.github.com/repos/adoptium/temurin${major}-binaries/releases/tags/jdk-${version}`;
        const { data } = await axios.get(apiUrl, { headers: { Accept: 'application/vnd.github.v3+json' } });
        const asset = data.assets.find(a => {
          const n = a.name.toLowerCase();
          if (process.platform === 'win32')   return n.endsWith('.zip')   && n.includes('windows');
          if (process.platform === 'darwin')  return n.endsWith('.tar.gz') && n.includes('mac');
          return n.endsWith('.tar.gz')        && n.includes('linux');
        });
        if (!asset) throw new Error('No suitable Temurin asset found');
        downloadInfo = { url: asset.browser_download_url, type: asset.name.endsWith('.zip') ? 'zip' : 'tgz' };

      } else {
        throw new Error(`Unsupported vendor: ${vendor}`);
      }

      // Download and extract
      await fs.ensureDir(VERSIONS);
      const targetDir = path.join(VERSIONS, `jdk-${version} (${vendor})`);
      if (await fs.pathExists(targetDir)) {
        console.log(`jdk-${version}-${vendor} is already installed, skipping.`);
        return;
      }

      console.log(`Downloading from: ${downloadInfo.url}`);
      const tmpFile = path.join(os.tmpdir(), path.basename(downloadInfo.url));
      const opts = { responseType: 'stream' };
      if (downloadInfo.cookie) opts.headers = { 'Cookie': 'oraclelicense=accept-securebackup-cookie' };
      const res = await axios.get(downloadInfo.url, opts);
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tmpFile);
        res.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const tmpExtract = path.join(os.tmpdir(), `jvm-extract-${version}-${Date.now()}`);
      await fs.ensureDir(tmpExtract);
      if (downloadInfo.type === 'zip') {
        await extract(tmpFile, { dir: tmpExtract });
      } else {
        await tar.x({ file: tmpFile, cwd: tmpExtract });
      }

      // Move inner directory contents into targetDir
      let inner = tmpExtract;
      const items = await fs.readdir(tmpExtract);
      if (items.length === 1) {
        const candidate = path.join(tmpExtract, items[0]);
        if ((await fs.stat(candidate)).isDirectory()) inner = candidate;
      }
      await fs.ensureDir(targetDir);
      await fs.emptyDir(targetDir);
      for (const name of await fs.readdir(inner)) {
        await fs.move(
          path.join(inner, name),
          path.join(targetDir, name),
          { overwrite: true }
        );
      }

      // Cleanup
      await fs.remove(tmpExtract);
      await fs.remove(tmpFile);

      console.log(`✔️  jdk-${version}-${vendor} successfully installed at: ${targetDir}`);
    } catch (err) {
      console.error('Error during install:', err.message);
      process.exit(1);
    }
  });

// -------------------- UNINSTALL / RM --------------------

program
  .command("uninstall <version>")
  .alias("rm")
  .description("Uninstall the specified JDK version")
  .action(async (version) => {
    try {
      if (!(await fs.pathExists(VERSIONS))) {
        console.error("No versions installed yet.");
        process.exit(1);
      }

      const entries = await fs.readdir(VERSIONS);
      const dirs = entries.filter((name) =>
        fs.statSync(path.join(VERSIONS, name)).isDirectory()
      );
      if (dirs.length === 0) {
        console.error("No versions installed yet.");
        process.exit(1);
      }

      const prefix = version.startsWith("jdk-") ? version : `jdk-${version}`;
      let matches = dirs.filter((d) => d.startsWith(prefix));
      let target;
      if (matches.length === 1) {
        target = matches[0];
      } else {
        // semver için isimden jdk- kısmını çıkar
        const semvers = dirs
          .map((d) => ({ raw: d, ver: d.replace(/^jdk-/, "") }))
          .filter((x) => semver.valid(x.ver));
        const best = semver.maxSatisfying(
          semvers.map((x) => x.ver),
          version,
          { includePrerelease: true }
        );
        target = semvers.find((x) => x.ver === best)?.raw;
      }

      if (!target) {
        console.error(`Version not found: ${version}`);
        process.exit(1);
      }

      const targetDir = path.join(VERSIONS, target);

      await fs.remove(targetDir);
      console.log(`✔️  ${target} uninstalled successfully.`);

      const currentLink = path.join(JVM_HOME, "current");
      if (await fs.pathExists(currentLink)) {
        const real = await fs.realpath(currentLink);
        if (real === targetDir) {
          await fs.remove(currentLink);
          console.log("ℹ️  Current version unset.");
        }
      }
    } catch (err) {
      console.error("Error in uninstall command:", err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
