(function () {
  const apiBaseInput = document.getElementById("apiBase");
  const apiTokenInput = document.getElementById("apiToken");
  const loadQueueBtn = document.getElementById("loadQueueBtn");
  const queueMeta = document.getElementById("queueMeta");
  const queueList = document.getElementById("queueList");
  const statusMessage = document.getElementById("statusMessage");
  const statusFilters = document.getElementById("statusFilters");

  const state = {
    status: "queued",
    loading: false,
    queueItems: [],
    totalQueued: null,
  };

  function setStatusMessage(message, tone) {
    statusMessage.textContent = message || "";
    statusMessage.dataset.tone = tone || "";
  }

  function trimBaseUrl(value) {
    return (value || "").trim().replace(/\/+$/, "");
  }

  function getHeaders() {
    const token = (apiTokenInput.value || "").trim();
    const headers = {
      "Content-Type": "application/json",
      "X-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  function setLoading(loading) {
    state.loading = loading;
    loadQueueBtn.disabled = loading;
    loadQueueBtn.textContent = loading ? "Loading..." : "Load Queue";
  }

  function escapeHtml(input) {
    return String(input ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(ts) {
    if (!ts || !Number.isFinite(ts)) return "-";
    return new Date(ts).toLocaleString();
  }

  function renderQueue() {
    queueMeta.textContent =
      state.totalQueued == null ? "Total queued: -" : `Total queued: ${state.totalQueued}`;

    if (!state.queueItems.length) {
      queueList.innerHTML = '<div class="admin-empty">No requests for current filter.</div>';
      return;
    }

    queueList.innerHTML = state.queueItems
      .map((item) => {
        const disableContacted = item.status === "contacted";
        const disableClosed = item.status === "closed";
        return `
          <article class="admin-request-card" data-request-id="${escapeHtml(item.requestId)}">
            <div class="admin-request-head">
              <strong>${escapeHtml(item.phone)}</strong>
              <span class="admin-badge admin-badge-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
            </div>
            <p class="admin-request-meta">Request: ${escapeHtml(item.requestId)}</p>
            <p class="admin-request-meta">User: ${escapeHtml(item.userId)}</p>
            <p class="admin-request-meta">Created: ${escapeHtml(formatDate(item.createdAt))}</p>
            <p class="admin-request-note">${escapeHtml(item.note || "No user note")}</p>
            ${
              item.adminNote
                ? `<p class="admin-request-admin-note">Admin note: ${escapeHtml(item.adminNote)}</p>`
                : ""
            }
            <div class="admin-request-actions">
              <button type="button" class="admin-action-btn" data-action="contacted" ${
                disableContacted ? "disabled" : ""
              }>Mark Contacted</button>
              <button type="button" class="admin-action-btn" data-action="closed" ${
                disableClosed ? "disabled" : ""
              }>Mark Closed</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function loadQueue() {
    const baseUrl = trimBaseUrl(apiBaseInput.value);
    if (!baseUrl) {
      setStatusMessage("API base URL is required.", "error");
      return;
    }

    setLoading(true);
    setStatusMessage("", "");
    try {
      const query = new URLSearchParams({
        status: state.status,
        limit: "100",
      });

      const response = await fetch(`${baseUrl}/v1/therapy/callback/queue?${query.toString()}`, {
        method: "GET",
        headers: getHeaders(),
      });

      const responseText = await response.text();
      const payload = responseText ? JSON.parse(responseText) : {};

      if (!response.ok || !payload.ok) {
        const message = payload?.error?.message || `Queue request failed (${response.status})`;
        throw new Error(message);
      }

      state.queueItems = Array.isArray(payload.requests) ? payload.requests : [];
      state.totalQueued =
        typeof payload.totalQueued === "number" ? payload.totalQueued : null;

      renderQueue();
      setStatusMessage("Queue refreshed.", "success");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Queue request failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function patchStatus(requestId, nextStatus) {
    const baseUrl = trimBaseUrl(apiBaseInput.value);
    if (!baseUrl) {
      setStatusMessage("API base URL is required.", "error");
      return;
    }

    setLoading(true);
    setStatusMessage("", "");
    try {
      const response = await fetch(
        `${baseUrl}/v1/therapy/callback/${encodeURIComponent(requestId)}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const responseText = await response.text();
      const payload = responseText ? JSON.parse(responseText) : {};

      if (!response.ok || !payload.ok) {
        const message = payload?.error?.message || `Status update failed (${response.status})`;
        throw new Error(message);
      }

      await loadQueue();
      setStatusMessage(`Request ${requestId} updated to ${nextStatus}.`, "success");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Status update failed.",
        "error"
      );
      setLoading(false);
    }
  }

  statusFilters.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const nextStatus = target.dataset.status;
    if (!nextStatus) return;

    state.status = nextStatus;
    statusFilters
      .querySelectorAll(".admin-chip")
      .forEach((btn) => btn.classList.remove("is-active"));
    target.classList.add("is-active");
  });

  queueList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const action = target.dataset.action;
    if (!action) return;

    const card = target.closest(".admin-request-card");
    if (!(card instanceof HTMLElement)) return;
    const requestId = card.dataset.requestId;
    if (!requestId) return;

    void patchStatus(requestId, action);
  });

  loadQueueBtn.addEventListener("click", () => {
    void loadQueue();
  });
})();
