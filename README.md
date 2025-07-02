# jvm

**Simple Java Version Manager CLI**

**Repository:** [https://github.com/Goktas44](https://github.com/Goktas44/jvm)

---

## 📦 Installation

Install globally via npm:

```bash
npm install -g sjvm
```

> **Note**: On Windows, the installer will automatically append `%JAVA_HOME%\\bin` to your user PATH.
> On macOS/Linux, add the following line to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) if you haven’t already:

```bash
export PATH="$JAVA_HOME/bin:$PATH"
```

---

## 🚀 Usage

After installation, use the `jvm` command in your terminal:

```bash
jvm <command> [options]
```

You can also use these aliases:

* `jvm ls` ⇒ `jvm list`
* `jvm i`  ⇒ `jvm install`
* `jvm u`  ⇒ `jvm use`
* `jvm rm` ⇒ `jvm uninstall`

---

## 📋 Commands

### list / ls

List all installed JDK versions.
The currently active version is marked with `*` and labeled `(current)`.

```bash
jvm ls
```

**Options:**

* `-v, --verbose`  Show full installation paths.

---

### install / i

Download and install the specified JDK version into `~/.jvm/versions/jdk-<version>`.

* **Default version:** `17` if none is specified.
* **Default vendor:** `oracle` if none is specified.
* **Interactive vendor selection:** If you run `jvm install` without providing a vendor (or provide an unrecognized vendor), you will be prompted to choose from:

  1. Oracle
  2. Temurin (Adoptium)
  3. Corretto (Amazon)
  4. Liberica (BellSoft)

**Example interactive session:**

```bash
$ jvm install <version>
Which JDK distribution would you like to install?
  Oracle
  Temurin
> Corretto
  Liberica
```

```bash
# Install JDK 17 from Oracle (default)
jvm install

# Install JDK 11 from Temurin explicitly
jvm install 11 temurin
```

---

### use / u

Switch your active JDK to `<version>`.
– On **Windows**, sets `%JAVA_HOME%` system-wide.
– On **macOS/Linux**, prints an `export JAVA_HOME=…` command you can `eval`.

```bash
jvm use 17
# or
eval "$(jvm use 11.0.16)"
```

---

### uninstall / rm

Remove a previously installed JDK version.

```bash
jvm uninstall 11
# or
jvm rm jdk-11.0.16
```

---

## 🛠️ Examples

```bash
# List installed versions
jvm ls

# Install default JDK (17/Oracle)
jvm install

# Install JDK 21 (Oracle by default)
jvm install 21

# Install JDK 11 from Temurin
jvm install 11 temurin

# Switch to JDK 21
eval "$(jvm use 21)"

# Uninstall JDK 16
jvm rm 16
```

---

## ⚙️ Shell Integration (macOS/Linux)

To make `jvm use` automatically update your `PATH`, add this to your profile:

```bash
# ~/.bashrc or ~/.zshrc
export PATH="$JAVA_HOME/bin:$PATH"
```

Then reload:

```bash
source ~/.bashrc   # or source ~/.zshrc
```

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check [issues](https://github.com/Goktas44/jvm/issues) or open a pull request.

---

## 📄 License

MIT © Abdurrahman Göktaş

*Enjoy working with multiple JDK versions!*
