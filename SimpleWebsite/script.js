const codeInput = document.getElementById("codeInput");
const outputBox = document.getElementById("outputBox");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadTxtBtn = document.getElementById("downloadTxtBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const statusBadge = document.getElementById("statusBadge");
const historyCount = document.getElementById("historyCount");

let pyodideReady = false;
let pyodideInstance = null;
let sessionHistory = [];

function setStatus(text, type = "neutral") {
  statusBadge.textContent = text;
  statusBadge.className = `status-badge ${type}`;
}

function updateHistoryCount() {
  historyCount.textContent = `Runs: ${sessionHistory.length}`;
}

function recordSessionRun(code, output) {
  sessionHistory.push({
    code,
    output,
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
    lines.push("Input:");
    lines.push(entry.code || "No code entered.");
    lines.push("Output:");
    lines.push(entry.output || "No output.");
    lines.push("--------------------------------------------------");
    lines.push("");
  });

  return lines.join("\n");
}

async function initializePyodide() {
  if (pyodideReady && pyodideInstance) {
    return pyodideInstance;
  }

  setStatus("Loading Python...", "running");

  try {
    pyodideInstance = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });
    pyodideReady = true;
    setStatus("Ready", "success");
    return pyodideInstance;
  } catch (error) {
    console.error(error);
    setStatus("Python failed to load", "error");
    outputBox.textContent = "Unable to load Python engine. Please refresh the page and try again.";
    throw error;
  }
}

async function runPythonCode() {
  const code = codeInput.value.trim();

  if (!code) {
    outputBox.textContent = "Please enter some Python code first.";
    setStatus("No code entered", "error");
    return;
  }

  setStatus("Running...", "running");
  outputBox.textContent = "Executing your Python code...";

  try {
    const pyodide = await initializePyodide();
    pyodide.globals.set("user_code", code);

    const result = await pyodide.runPythonAsync(`
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

    const finalOutput = result || "Program executed successfully with no output.";
    outputBox.textContent = finalOutput;
    recordSessionRun(code, finalOutput);
    setStatus("Execution complete", "success");
  } catch (error) {
    console.error(error);
    const errorMessage = `Runtime Error:\n${error}`;
    outputBox.textContent = errorMessage;
    recordSessionRun(code, errorMessage);
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

runBtn.addEventListener("click", runPythonCode);
clearBtn.addEventListener("click", clearEditor);
downloadBtn.addEventListener("click", downloadPdf);
downloadTxtBtn.addEventListener("click", downloadTxt);
clearHistoryBtn.addEventListener("click", clearSessionHistory);

window.addEventListener("load", () => {
  outputBox.textContent = "Your program output will appear here.";
  updateHistoryCount();
  setStatus("Ready", "neutral");
});
