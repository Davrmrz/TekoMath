// MateJopara Localization Tool - Client JS

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "warning") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global API helper
async function fetchAPI(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || `Error ${res.status}`);
    }
    return data;
  } catch (err) {
    showToast(err.message, "error");
    throw err;
  }
}

// Table search filter helper
function filterTable(tableId, query) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const q = query.toLowerCase().trim();
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(q) ? "" : "none";
  });
}

// Translate all batch action
async function translateAll(projectId) {
  const btn = document.getElementById("btn-translate-all");
  const progressBox = document.getElementById("batch-progress");
  if (btn) btn.disabled = true;
  if (progressBox) progressBox.style.display = "block";

  showToast("Iniciando traducción por lotes...", "info");

  try {
    const data = await fetchAPI(`/api/projects/${projectId}/translate-all`, {
      method: "POST"
    });
    showToast(`Traducción completada: ${data.processed} procesadas, ${data.errors} errores.`, data.errors > 0 ? "warning" : "success");
    setTimeout(() => window.location.reload(), 1200);
  } catch (e) {
    if (btn) btn.disabled = false;
  }
}

// Retry errors batch action
async function retryErrors(projectId) {
  showToast("Reintentando unidades con error...", "info");
  try {
    const data = await fetchAPI(`/api/projects/${projectId}/retry-errors`, {
      method: "POST"
    });
    showToast(`Reintento completado: ${data.processed} procesadas, ${data.errors} errores.`, data.errors > 0 ? "warning" : "success");
    setTimeout(() => window.location.reload(), 1200);
  } catch (e) {}
}

// Unit Actions in Review Studio
async function approveUnit(unitId) {
  try {
    await fetchAPI(`/api/units/${unitId}/approve`, { method: "POST" });
    showToast("Unidad aprobada y guardada en Memoria de Traducción.", "success");
    const badge = document.getElementById(`status-badge-${unitId}`);
    if (badge) {
      badge.className = "badge badge-human_validated";
      badge.innerText = "HUMAN_VALIDATED";
    }
  } catch (e) {}
}

async function rejectUnit(unitId) {
  try {
    await fetchAPI(`/api/units/${unitId}/reject`, { method: "POST" });
    showToast("Unidad marcada como rechazada.", "warning");
    const badge = document.getElementById(`status-badge-${unitId}`);
    if (badge) {
      badge.className = "badge badge-rejected";
      badge.innerText = "REJECTED";
    }
  } catch (e) {}
}

async function saveUnitEdit(unitId) {
  const textarea = document.getElementById(`target-text-${unitId}`);
  if (!textarea) return;
  const newText = textarea.value;

  try {
    const res = await fetchAPI(`/api/units/${unitId}/save-edit`, {
      method: "POST",
      body: JSON.stringify({ text: newText })
    });
    showToast("Edición guardada correctamente.", "success");
    const badge = document.getElementById(`status-badge-${unitId}`);
    if (badge) {
      badge.className = `badge badge-${res.status.toLowerCase()}`;
      badge.innerText = res.status;
    }
  } catch (e) {}
}

async function regenerateUnit(unitId) {
  showToast("Regenerando propuesta con el motor de localización...", "info");
  try {
    const res = await fetchAPI(`/api/units/${unitId}/regenerate`, { method: "POST" });
    const textarea = document.getElementById(`target-text-${unitId}`);
    if (textarea) textarea.value = res.target_text;
    const badge = document.getElementById(`status-badge-${unitId}`);
    if (badge) {
      badge.className = `badge badge-${res.status.toLowerCase()}`;
      badge.innerText = res.status;
    }
    showToast("Propuesta regenerada con éxito.", "success");
  } catch (e) {}
}

// Quick Add to Glossary from Review
function openAddToGlossaryModal(sourceText) {
  const modal = document.getElementById("add-glossary-modal");
  const inputSource = document.getElementById("modal-source-term");
  if (modal && inputSource) {
    inputSource.value = sourceText.trim();
    modal.classList.add("active");
  }
}

function closeGlossaryModal() {
  const modal = document.getElementById("add-glossary-modal");
  if (modal) modal.classList.remove("active");
}

async function submitGlossaryItem(event) {
  event.preventDefault();
  const sourceTerm = document.getElementById("modal-source-term").value;
  const preferredOutput = document.getElementById("modal-preferred-output").value;
  const status = document.getElementById("modal-status").value;
  const reason = document.getElementById("modal-reason").value;

  try {
    await fetchAPI("/api/glossary", {
      method: "POST",
      body: JSON.stringify({
        source_term: sourceTerm,
        preferred_output: preferredOutput,
        status: status,
        reason: reason
      })
    });
    showToast("Término añadido al Glosario con éxito.", "success");
    closeGlossaryModal();
  } catch (e) {}
}

// Test Provider Connection
async function testConnection() {
  const btn = document.getElementById("btn-test-conn");
  const resultDiv = document.getElementById("test-result");
  if (btn) btn.disabled = true;
  if (resultDiv) {
    resultDiv.className = "alert alert-info";
    resultDiv.innerText = "Probando conexión con el proveedor configurado...";
    resultDiv.style.display = "block";
  }

  try {
    const res = await fetchAPI("/api/settings/test-connection", { method: "POST" });
    if (res.success) {
      resultDiv.className = "alert alert-success";
      resultDiv.innerText = `✅ ${res.message}`;
    } else {
      resultDiv.className = "alert alert-danger";
      resultDiv.innerText = `❌ ${res.message}`;
    }
  } catch (e) {
    if (resultDiv) {
      resultDiv.className = "alert alert-danger";
      resultDiv.innerText = `❌ Error: ${e.message}`;
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}
