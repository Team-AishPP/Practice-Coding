const codeInput = document.getElementById("codeInput");
const outputBox = document.getElementById("outputBox");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusBadge = document.getElementById("statusBadge");

let pyodideReady = false;
let pyodideInstance = null;

function setStatus(text, type = "neutral") {
  statusBadge.textContent = text;
  statusBadge.className = `status-badge ${type}`;
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
    setStatus("Execution complete", "success");
  } catch (error) {
    console.error(error);
    outputBox.textContent = `Runtime Error:\n${error}`;
    setStatus("Execution failed", "error");
  }
}

function clearEditor() {
  codeInput.value = "";
  outputBox.textContent = "Your program output will appear here.";
  setStatus("Ready", "neutral");
}

function downloadPdf() {
  const content = outputBox.textContent.trim();

  if (!content || content === "Your program output will appear here.") {
    outputBox.textContent = "No output available to save as PDF.";
    setStatus("No output", "warning");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const lineHeight = 7;
  const maxWidth = pageWidth - margin * 2;

  const lines = doc.splitTextToSize(content, maxWidth);

  doc.text("Code Checker Output", margin, 15);
  doc.setFontSize(11);

  let y = 28;
  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save("code-checker-output.pdf");
  setStatus("PDF ready", "success");
}

runBtn.addEventListener("click", runPythonCode);
clearBtn.addEventListener("click", clearEditor);
downloadBtn.addEventListener("click", downloadPdf);

window.addEventListener("load", () => {
  outputBox.textContent = "Your program output will appear here.";
  setStatus("Ready", "neutral");
});
