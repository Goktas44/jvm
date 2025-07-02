# jvm

**Simple Java Version Manager CLI**

---

## 📦 Installation

Install globally via npm:

```bash
npm install -g sjvm
```

> **Note**: On Windows, the installer will automatically append `%JAVA_HOME%\bin` to your user PATH.
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

* `-v, --verbose`
  Show full installation paths.

---

### install / i

Download and install Oracle JDK `<version>` into `~/.jvm/versions/<version>`.

```bash
jvm install 17
# or
jvm i 17.0.2
```

---

### use / u

Switch your active JDK to `<version>`.
– On **Windows**, sets `%JAVA_HOME%` system-wide.
– On **macOS/Linux**, prints an `export JAVA_HOME=…` command you can `eval`.

```bash
jvm use 17
# or
jvm u 11.0.16
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

# Install JDK 21
jvm install 21

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
Feel free to check [issues](https://github.com/your-repo/jvm/issues) or open a pull request.

---

## 📄 License

MIT © Abdurrahman Göktaş

*Enjoy working with multiple JDK versions!*
