(function () {
  const STORAGE_KEY = "dailyItemLogs.v1";
  const form = document.getElementById("logForm");
  const personName = document.getElementById("personName");
  const itemName = document.getElementById("itemName");
  const notes = document.getElementById("notes");
  const searchInput = document.getElementById("searchInput");
  const dateFilter = document.getElementById("dateFilter");
  const clearFilters = document.getElementById("clearFilters");
  const refreshLogs = document.getElementById("refreshLogs");
  const logsContainer = document.getElementById("logsContainer");
  const emptyState = document.getElementById("emptyState");
  const resultCount = document.getElementById("resultCount");
  const todayCount = document.getElementById("todayCount");
  const totalCount = document.getElementById("totalCount");
  const groupTemplate = document.getElementById("dateGroupTemplate");

  let logs = loadLogs();

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDayName(dateValue) {
    const date = new Date(dateValue + "T12:00:00");
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }

  function formatDate(dateValue) {
    const date = new Date(dateValue + "T12:00:00");
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function formatTime(isoValue) {
    return new Date(isoValue).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function loadLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveLogs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getFilteredLogs() {
    const query = normalize(searchInput.value);
    const selectedDate = dateFilter.value;

    return logs
      .filter((log) => {
        const matchesDate = !selectedDate || log.date === selectedDate;
        const haystack = [
          log.person,
          log.item,
          log.date,
          log.day,
          log.notes
        ].map(normalize).join(" ");

        return matchesDate && (!query || haystack.includes(query));
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  function groupByDate(filteredLogs) {
    return filteredLogs.reduce((groups, log) => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
      return groups;
    }, {});
  }

  function render() {
    const filteredLogs = getFilteredLogs();
    const groupedLogs = groupByDate(filteredLogs);
    const todayTotal = logs.filter((log) => log.date === todayIso()).length;

    logsContainer.innerHTML = "";
    todayCount.textContent = todayTotal;
    totalCount.textContent = logs.length;
    resultCount.textContent = `${filteredLogs.length} ${filteredLogs.length === 1 ? "log" : "logs"} found`;
    emptyState.style.display = filteredLogs.length ? "none" : "block";

    Object.keys(groupedLogs).forEach((date) => {
      const group = groupTemplate.content.cloneNode(true);
      const rows = groupedLogs[date];
      const article = group.querySelector(".date-group");
      const title = group.querySelector(".date-title");
      const count = group.querySelector(".date-count");
      const tbody = group.querySelector("tbody");

      title.textContent = formatDate(date);
      count.textContent = `${rows.length} ${rows.length === 1 ? "entry" : "entries"}`;

      rows.forEach((log) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${formatTime(log.createdAt)}</td>
          <td>${escapeHtml(log.person)}</td>
          <td>${escapeHtml(log.item)}</td>
          <td>${escapeHtml(log.notes || "")}</td>
          <td><button class="delete-log" type="button" data-id="${log.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });

      article.querySelector(".date-heading").addEventListener("click", () => {
        const tableWrap = article.querySelector(".table-wrap");
        tableWrap.hidden = !tableWrap.hidden;
      });

      logsContainer.appendChild(group);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const entryDate = todayIso();
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      person: personName.value.trim(),
      item: itemName.value.trim(),
      date: entryDate,
      day: getDayName(entryDate),
      notes: notes.value.trim(),
      createdAt: new Date().toISOString()
    };

    logs.push(entry);
    saveLogs();
    form.reset();
    personName.focus();
    render();
  });

  logsContainer.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-log");
    if (!deleteButton) return;

    logs = logs.filter((log) => log.id !== deleteButton.dataset.id);
    saveLogs();
    render();
  });

  searchInput.addEventListener("input", render);
  dateFilter.addEventListener("change", render);
  clearFilters.addEventListener("click", () => {
    searchInput.value = "";
    dateFilter.value = "";
    render();
  });
  refreshLogs.addEventListener("click", () => {
    logs = loadLogs();
    render();
  });

  render();
})();
