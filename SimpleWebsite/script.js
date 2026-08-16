const codeInput = document.getElementById("codeInput");
const outputBox = document.getElementById("outputBox");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadTxtBtn = document.getElementById("downloadTxtBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const statusBadge = document.getElementById("statusBadge");
const historyCount = document.getElementById("historyCount");
const languageSelect = document.getElementById("languageSelect");
const languageEyebrow = document.getElementById("languageEyebrow");
const editorTitle = document.getElementById("editorTitle");

const languageConfig = {
  python: {
    label: "Python",
    eyebrow: "Python Playground",
    title: "Python Editor",
    starter: `print("Welcome to Code Checker!")
name = "Developer"
print(f"Hello, {name}!")

for i in range(1, 6):
    print(i)
`,
    run: async function runPythonCode(code) {
      if (!window.loadPyodide) {
        throw new Error("Python engine is not available in this browser.");
      }

      if (!pyodideReady || !pyodideInstance) {
        pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        });
        pyodideReady = true;
      }

      pyodideInstance.globals.set("user_code", code);
      const result = await pyodideInstance.runPythonAsync(`
import io
import sys
import traceback

stdout = io.StringIO()
stderr = io.StringIO()
old_stdout = sys.stdout
old_stderr = sys.stderr

sys.stdout = stdout
sys.stderr = stderr

try:
    exec(compile(user_code, "<user_code>", "exec"), {})
except Exception:
    traceback.print_exc()
finally:
    sys.stdout = old_stdout
    sys.stderr = old_stderr

output = stdout.getvalue() + stderr.getvalue()
output
`);

      return result || "Program executed successfully with no output.";
    },
  },
  javascript: {
    label: "JavaScript",
    eyebrow: "JavaScript Playground",
    title: "JavaScript Editor",
    starter: `console.log("Welcome to Code Checker!");
const name = "Developer";
console.log("Hello, " + name + "!");

for (let i = 1; i <= 5; i++) {
  console.log(i);
}
`,
    run: function runJavaScriptCode(code) {
      const logMessages = [];
      const consoleProxy = {
        log: (...args) => logMessages.push(args.join(" ")),
        error: (...args) => logMessages.push(args.join(" ")),
      };

      const script = new Function("console", code);
      script(consoleProxy);
      return logMessages.length ? logMessages.join("\n") : "JavaScript executed successfully with no output.";
    },
  },
  html: {
    label: "HTML",
    eyebrow: "HTML Preview",
    title: "HTML Editor",
    starter: `<!DOCTYPE html>
<html>
  <body>
    <h1>Hello from HTML!</h1>
    <p>This is rendered in the preview panel.</p>
  </body>
</html>
`,
    run: function runHtmlCode(code) {
      outputBox.classList.add("html-output");
      outputBox.innerHTML = code;
      return "HTML preview rendered in the output panel.";
    },
  },
  c: {
    label: "C",
    eyebrow: "C Playground",
    title: "C Editor",
    starter: `#include <stdio.h>

int main() {
    printf("Welcome to Code Checker!\\n");
    printf("Hello, Developer!\\n");
    for (int i = 1; i <= 5; i++) {
        printf("%d\\n", i);
    }
    return 0;
}
`,
    run: function runUnsupportedLanguage() {
      return "C execution is not available in the browser on this page. Use a local compiler or another online sandbox for C code.";
    },
  },
  cpp: {
    label: "C++",
    eyebrow: "C++ Playground",
    title: "C++ Editor",
    starter: `#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to Code Checker!" << endl;
    cout << "Hello, Developer!" << endl;
    for (int i = 1; i <= 5; i++) {
        cout << i << endl;
    }
    return 0;
}
`,
    run: function runUnsupportedLanguage() {
      return "C++ execution is not available in the browser on this page. Use a local compiler or another online sandbox for C++ code.";
    },
  },
  java: {
    label: "Java",
    eyebrow: "Java Playground",
    title: "Java Editor",
    starter: `public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to Code Checker!");
        System.out.println("Hello, Developer!");
        for (int i = 1; i <= 5; i++) {
            System.out.println(i);
        }
    }
}
`,
    run: function runUnsupportedLanguage() {
      return "Java execution is not available in the browser on this page. Use a local JDK or another online compiler for Java code.";
    },
  },
  typescript: {
    label: "TypeScript",
    eyebrow: "TypeScript Playground",
    title: "TypeScript Editor",
    starter: "const name: string = \"Developer\";\nconsole.log(\"Welcome to Code Checker!\");\nconsole.log(`Hello, ${name}!`);\n\nfor (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n",
    run: function runUnsupportedLanguage() {
      return "TypeScript is not directly executable in the browser without transpilation. Paste the generated JavaScript or use a TypeScript compiler for execution.";
    },
  },
  ruby: {
    label: "Ruby",
    eyebrow: "Ruby Playground",
    title: "Ruby Editor",
    starter: `puts "Welcome to Code Checker!"
name = "Developer"
puts "Hello, #{name}!"

(1..5).each do |i|
  puts i
end
`,
    run: function runUnsupportedLanguage() {
      return "Ruby execution is not available in the browser on this page. Use a Ruby runtime on your system or another online interpreter.";
    },
  },
  php: {
    label: "PHP",
    eyebrow: "PHP Playground",
    title: "PHP Editor",
    starter: `<?php
  echo "Welcome to Code Checker!\n";
  $name = "Developer";
  echo "Hello, $name!\n";

  for ($i = 1; $i <= 5; $i++) {
      echo $i . "\n";
  }
?>
`,
    run: function runUnsupportedLanguage() {
      return "PHP execution is not available in the browser on this page. Use a local PHP server or another online PHP sandbox.";
    },
  },
  go: {
    label: "Go",
    eyebrow: "Go Playground",
    title: "Go Editor",
    starter: `package main

import "fmt"

func main() {
    fmt.Println("Welcome to Code Checker!")
    fmt.Println("Hello, Developer!")
    for i := 1; i <= 5; i++ {
        fmt.Println(i)
    }
}
`,
    run: function runUnsupportedLanguage() {
      return "Go execution is not available in the browser on this page. Use a local Go toolchain or another online Go compiler.";
    },
  },
  csharp: {
    label: "C#",
    eyebrow: "C# Playground",
    title: "C# Editor",
    starter: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Welcome to Code Checker!");
        Console.WriteLine("Hello, Developer!");
        for (int i = 1; i <= 5; i++) {
            Console.WriteLine(i);
        }
    }
}
`,
    run: function runUnsupportedLanguage() {
      return "C# execution is not available in the browser on this page. Use a local .NET SDK or another online C# compiler.";
    },
  },
};

let pyodideReady = false;
let pyodideInstance = null;
let sessionHistory = [];

function setStatus(text, type = "neutral") {
  statusBadge.textContent = text;
  statusBadge.className = `status-badge ${type}`;
}

function changeLanguage(selectedLanguage) {
  const config = languageConfig[selectedLanguage] || languageConfig.python;

  languageEyebrow.textContent = config.eyebrow;
  editorTitle.textContent = config.title;
  codeInput.setAttribute("aria-label", `${config.label} code editor`);

  if (!codeInput.dataset.language || codeInput.dataset.language !== selectedLanguage) {
    codeInput.value = config.starter;
    codeInput.dataset.language = selectedLanguage;
  }

  if (selectedLanguage === "html") {
    outputBox.classList.add("html-output");
    outputBox.innerHTML = codeInput.value;
  } else {
    outputBox.classList.remove("html-output");
    outputBox.textContent = "Your program output will appear here.";
  }

  setStatus("Ready", "neutral");
}

function updateHistoryCount() {
  historyCount.textContent = `Runs: ${sessionHistory.length}`;
}

function recordSessionRun(code, output, language = "Unknown") {
  sessionHistory.push({
    code,
    output,
    language,
    timestamp: new Date().toLocaleString(),
  });
  updateHistoryCount();
}

function buildSessionReportText() {
  const generatedAt = new Date().toLocaleString();

  const lines = [
    "Code Checker Session Report",
    `Generated: ${generatedAt}`,
    "",
  ];

  sessionHistory.forEach((entry, index) => {
    lines.push(`Run ${index + 1} - ${entry.timestamp}`);
    lines.push(`Language: ${entry.language || "Unknown"}`);
    lines.push("Input:");
    lines.push(entry.code || "No code entered.");
    lines.push("Output:");
    lines.push(entry.output || "No output.");
    lines.push("--------------------------------------------------");
    lines.push("");
  });

  return lines.join("\n");
}

async function runCurrentLanguageCode() {
  const selectedLanguage = languageSelect.value;
  const config = languageConfig[selectedLanguage] || languageConfig.python;
  const code = codeInput.value.trim();

  if (!code) {
    outputBox.textContent = `Please enter some ${config.label} code first.`;
    setStatus("No code entered", "error");
    return;
  }

  setStatus("Running...", "running");

  if (selectedLanguage === "html") {
    outputBox.classList.add("html-output");
    outputBox.innerHTML = code;
    recordSessionRun(code, "HTML preview rendered successfully.", config.label);
    setStatus("Execution complete", "success");
    return;
  }

  outputBox.classList.remove("html-output");
  outputBox.textContent = `Executing your ${config.label} code...`;

  try {
    const result = selectedLanguage === "python"
      ? await languageConfig.python.run(code)
      : await config.run(code);

    outputBox.textContent = result;
    recordSessionRun(code, result, config.label);
    setStatus("Execution complete", "success");
  } catch (error) {
    console.error(error);
    const errorMessage = `Runtime Error:\n${error}`;
    outputBox.textContent = errorMessage;
    recordSessionRun(code, errorMessage, config.label);
    setStatus("Execution failed", "error");
  }
}

function clearEditor() {
  codeInput.value = "";
  outputBox.textContent = "Your program output will appear here.";
  setStatus("Ready", "neutral");
}

function downloadPdf() {
  if (!sessionHistory.length) {
    outputBox.textContent = "No code checks were run in this session yet.";
    setStatus("No session history", "warning");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 16;

  const title = "Code Checker Session Report";
  doc.setFillColor(15, 25, 38);
  doc.rect(0, 0, pageWidth, 62, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title, margin, 38);

  doc.setTextColor(15, 23, 42);
  let y = 90;
  const pageBottom = 800;

  sessionHistory.forEach((entry, index) => {
    const sectionTitle = `Run ${index + 1} — ${entry.timestamp}`;
    const codeLines = doc.splitTextToSize(entry.code || "No code entered.", maxWidth);
    const outputLines = doc.splitTextToSize(entry.output || "No output.", maxWidth);

    if (y > pageBottom - 200) {
      doc.addPage();
      y = 52;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(sectionTitle, margin, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 120, 150);
    doc.text(`Language: ${entry.language || "Unknown"}`, margin, y);
    doc.setTextColor(15, 23, 42);
    y += 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Input:", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const line of codeLines) {
      if (y > pageBottom - 35) {
        doc.addPage();
        y = 52;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }

    y += 12;
    if (y > pageBottom - 120) {
      doc.addPage();
      y = 52;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Output:", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const line of outputLines) {
      if (y > pageBottom - 35) {
        doc.addPage();
        y = 52;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }

    y += 24;
    if (y > pageBottom - 40) {
      doc.addPage();
      y = 52;
    }
    doc.setDrawColor(200, 210, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;
  });

  doc.save("code-checker-session-report.pdf");
  setStatus("PDF ready", "success");
}

function downloadTxt() {
  if (!sessionHistory.length) {
    outputBox.textContent = "No code checks were run in this session yet.";
    setStatus("No session history", "warning");
    return;
  }

  const report = buildSessionReportText();
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "code-checker-session-report.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus("TXT ready", "success");
}

function clearSessionHistory() {
  sessionHistory = [];
  updateHistoryCount();
  outputBox.textContent = "Session history cleared. Run your code again to generate a new report.";
  setStatus("History cleared", "neutral");
}

runBtn.addEventListener("click", runCurrentLanguageCode);
clearBtn.addEventListener("click", clearEditor);
downloadBtn.addEventListener("click", downloadPdf);
downloadTxtBtn.addEventListener("click", downloadTxt);
clearHistoryBtn.addEventListener("click", clearSessionHistory);
languageSelect.addEventListener("change", (event) => {
  changeLanguage(event.target.value);
});

window.addEventListener("load", () => {
  languageSelect.value = "python";
  changeLanguage("python");
  updateHistoryCount();
  setStatus("Ready", "neutral");
});
