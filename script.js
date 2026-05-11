const storageKey = "contractor-management-system-v2";

const money = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const sampleContracts = [
  {
    id: "sample-1",
    company: "Bright Mall Pty Ltd",
    tenderAmount: 185000,
    startDate: "2026-04-01",
    endDate: "2026-05-15",
    projectStatus: "Active",
    notes: "Main DB upgrade, shop lighting, plug points, and compliance testing",
    payments: [
      { id: "pay-1", date: "2026-04-02", amount: 65000 },
      { id: "pay-2", date: "2026-04-24", amount: 55000 },
    ],
  },
  {
    id: "sample-2",
    company: "Sunrise Apartments",
    tenderAmount: 96500,
    startDate: "2026-03-10",
    endDate: "2026-04-05",
    projectStatus: "Completed",
    notes: "Unit rewiring, corridor lights, and emergency lighting repairs",
    payments: [{ id: "pay-3", date: "2026-04-05", amount: 96500 }],
  },
  {
    id: "sample-3",
    company: "Metro Cold Storage",
    tenderAmount: 248750,
    startDate: "2026-05-06",
    endDate: "2026-07-18",
    projectStatus: "Active",
    notes: "Three-phase installation, cable trays, isolators, and final COC",
    payments: [{ id: "pay-4", date: "2026-05-06", amount: 75000 }],
  },
  {
    id: "sample-4",
    company: "Greenfield Primary School",
    tenderAmount: 132400,
    startDate: "2026-04-22",
    endDate: "2026-06-03",
    projectStatus: "On Hold",
    notes: "Classroom lighting replacement, distribution board repairs, and safety inspection",
    payments: [{ id: "pay-5", date: "2026-04-30", amount: 55000 }],
  },
];

const elements = {
  form: document.querySelector("#contractForm"),
  paymentForm: document.querySelector("#paymentForm"),
  editingId: document.querySelector("#editingId"),
  company: document.querySelector("#company"),
  tenderAmount: document.querySelector("#tenderAmount"),
  amountPaid: document.querySelector("#amountPaid"),
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  projectStatus: document.querySelector("#projectStatus"),
  notes: document.querySelector("#notes"),
  liveBalance: document.querySelector("#liveBalance"),
  formTitle: document.querySelector("#formTitle"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  totalTender: document.querySelector("#totalTender"),
  totalPaid: document.querySelector("#totalPaid"),
  totalBalance: document.querySelector("#totalBalance"),
  activeProjects: document.querySelector("#activeProjects"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  contractsGrid: document.querySelector("#contractsGrid"),
  contractCount: document.querySelector("#contractCount"),
  emptyState: document.querySelector("#emptyState"),
  paymentContract: document.querySelector("#paymentContract"),
  paymentDate: document.querySelector("#paymentDate"),
  paymentAmount: document.querySelector("#paymentAmount"),
  paymentsTable: document.querySelector("#paymentsTable"),
  exportBtn: document.querySelector("#exportBtn"),
  printBtn: document.querySelector("#printBtn"),
  template: document.querySelector("#contractCardTemplate"),
};

let contracts = loadContracts();

function loadContracts() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) return saved;
  } catch (error) {
    console.warn("Could not load saved contracts.", error);
  }

  localStorage.setItem(storageKey, JSON.stringify(sampleContracts));
  return sampleContracts;
}

function saveContracts() {
  localStorage.setItem(storageKey, JSON.stringify(contracts));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getPaid(contract) {
  return (contract.payments || []).reduce((total, payment) => total + Number(payment.amount || 0), 0);
}

function getBalance(contract) {
  return Math.max(Number(contract.tenderAmount || 0) - getPaid(contract), 0);
}

function getDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end - start;

  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.floor(diff / 86400000) + 1;
}

function getProgress(contract) {
  const tender = Number(contract.tenderAmount || 0);
  if (tender === 0) return 0;
  return Math.min((getPaid(contract) / tender) * 100, 100);
}

function isOverdue(contract) {
  const today = new Date();
  const end = new Date(`${contract.endDate}T23:59:59`);
  return getBalance(contract) > 0 && end < today && contract.projectStatus !== "Completed";
}

function getDisplayStatus(contract) {
  if (getBalance(contract) === 0) return "Paid";
  if (isOverdue(contract)) return "Overdue";
  return contract.projectStatus;
}

function updateLiveBalance() {
  const paid = Number(elements.amountPaid.value || 0);
  const tender = Number(elements.tenderAmount.value || 0);
  elements.liveBalance.textContent = money.format(Math.max(tender - paid, 0));
}

function getFilteredContracts() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const status = elements.statusFilter.value;

  let rows = contracts.filter((contract) => {
    const displayStatus = getDisplayStatus(contract).toLowerCase();
    const haystack = `${contract.company} ${contract.notes}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesStatus =
      status === "all" ||
      displayStatus === status ||
      (status === "outstanding" && getBalance(contract) > 0);

    return matchesSearch && matchesStatus;
  });

  rows = rows.slice().sort((a, b) => {
    if (elements.sortSelect.value === "balance") return getBalance(b) - getBalance(a);
    if (elements.sortSelect.value === "tender") return Number(b.tenderAmount) - Number(a.tenderAmount);
    if (elements.sortSelect.value === "endDate") return a.endDate.localeCompare(b.endDate);
    return b.id.localeCompare(a.id);
  });

  return rows;
}

function renderMetrics() {
  const totals = contracts.reduce(
    (acc, contract) => {
      acc.tender += Number(contract.tenderAmount || 0);
      acc.paid += getPaid(contract);
      acc.balance += getBalance(contract);
      if (contract.projectStatus === "Active" && getBalance(contract) > 0) acc.active += 1;
      return acc;
    },
    { tender: 0, paid: 0, balance: 0, active: 0 }
  );

  elements.totalTender.textContent = money.format(totals.tender);
  elements.totalPaid.textContent = money.format(totals.paid);
  elements.totalBalance.textContent = money.format(totals.balance);
  elements.activeProjects.textContent = totals.active;
}

function renderContracts() {
  const rows = getFilteredContracts();
  elements.contractsGrid.innerHTML = "";
  elements.emptyState.hidden = rows.length > 0;
  elements.contractCount.textContent = `${rows.length} ${rows.length === 1 ? "contract" : "contracts"}`;

  rows.forEach((contract) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    const status = getDisplayStatus(contract);
    const balance = getBalance(contract);
    const duration = getDurationDays(contract.startDate, contract.endDate);
    const progress = getProgress(contract);

    card.dataset.id = contract.id;
    card.querySelector("h3").textContent = contract.company;

    const pill = card.querySelector(".status-pill");
    pill.textContent = status;
    pill.classList.add(status.toLowerCase().replaceAll(" ", "-"));

    card.querySelector('[data-field="tender"]').textContent = money.format(contract.tenderAmount);
    card.querySelector('[data-field="paid"]').textContent = money.format(getPaid(contract));
    card.querySelector('[data-field="balance"]').textContent = money.format(balance);
    card.querySelector('[data-field="duration"]').textContent = `${duration} ${duration === 1 ? "day" : "days"}`;
    card.querySelector(".progress-track span").style.width = `${progress}%`;
    card.querySelector(".meta").textContent = `${contract.startDate} to ${contract.endDate} | ${progress.toFixed(0)}% paid`;
    card.querySelector(".notes").textContent = contract.notes || "No notes added.";
    card.querySelector(".edit").addEventListener("click", () => editContract(contract.id));
    card.querySelector(".delete").addEventListener("click", () => deleteContract(contract.id));

    elements.contractsGrid.appendChild(card);
  });
}

function renderPaymentOptions() {
  elements.paymentContract.innerHTML = "";

  contracts
    .slice()
    .sort((a, b) => a.company.localeCompare(b.company))
    .forEach((contract) => {
      const option = document.createElement("option");
      option.value = contract.id;
      option.textContent = contract.company;
      elements.paymentContract.appendChild(option);
    });
}

function renderPayments() {
  const payments = contracts
    .flatMap((contract) =>
      (contract.payments || []).map((payment) => ({
        ...payment,
        contractId: contract.id,
        company: contract.company,
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  elements.paymentsTable.innerHTML = "";

  if (payments.length === 0) {
    elements.paymentsTable.innerHTML = '<tr><td colspan="4">No payments recorded yet.</td></tr>';
    return;
  }

  payments.forEach((payment) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Date">${escapeHtml(payment.date)}</td>
      <td data-label="Company">${escapeHtml(payment.company)}</td>
      <td data-label="Payment">${money.format(payment.amount)}</td>
      <td class="no-print" data-label="Action"><button class="small-button delete" type="button">Delete</button></td>
    `;
    row.querySelector("button").addEventListener("click", () => deletePayment(payment.contractId, payment.id));
    elements.paymentsTable.appendChild(row);
  });
}

function render() {
  renderMetrics();
  renderContracts();
  renderPaymentOptions();
  renderPayments();
}

function resetForm() {
  elements.form.reset();
  elements.editingId.value = "";
  elements.formTitle.textContent = "Add Contract";
  elements.cancelEditBtn.hidden = true;
  updateLiveBalance();
}

function editContract(id) {
  const contract = contracts.find((item) => item.id === id);
  if (!contract) return;

  elements.editingId.value = contract.id;
  elements.company.value = contract.company;
  elements.tenderAmount.value = contract.tenderAmount;
  elements.amountPaid.value = getPaid(contract);
  elements.startDate.value = contract.startDate;
  elements.endDate.value = contract.endDate;
  elements.projectStatus.value = contract.projectStatus;
  elements.notes.value = contract.notes;
  elements.formTitle.textContent = "Edit Contract";
  elements.cancelEditBtn.hidden = false;
  updateLiveBalance();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteContract(id) {
  if (!window.confirm("Delete this contract and its payment records?")) return;
  contracts = contracts.filter((contract) => contract.id !== id);
  saveContracts();
  render();
}

function deletePayment(contractId, paymentId) {
  contracts = contracts.map((contract) => {
    if (contract.id !== contractId) return contract;
    return {
      ...contract,
      payments: (contract.payments || []).filter((payment) => payment.id !== paymentId),
    };
  });
  saveContracts();
  render();
}

function exportCsv() {
  const rows = [
    ["Company", "Tender", "Paid", "Balance", "Start Date", "End Date", "Duration Days", "Status", "Notes"],
    ...contracts.map((contract) => [
      contract.company,
      contract.tenderAmount,
      getPaid(contract),
      getBalance(contract),
      contract.startDate,
      contract.endDate,
      getDurationDays(contract.startDate, contract.endDate),
      getDisplayStatus(contract),
      contract.notes,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return text.includes(",") || text.includes('"') ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "contractor-management-contracts.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

elements.form.addEventListener("input", updateLiveBalance);

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (new Date(elements.endDate.value) < new Date(elements.startDate.value)) {
    elements.endDate.setCustomValidity("End date must be after the start date.");
    elements.endDate.reportValidity();
    return;
  }

  elements.endDate.setCustomValidity("");

  const editingId = elements.editingId.value;
  const paid = Number(elements.amountPaid.value || 0);
  const contractData = {
    company: elements.company.value.trim(),
    tenderAmount: Number(elements.tenderAmount.value || 0),
    startDate: elements.startDate.value,
    endDate: elements.endDate.value,
    projectStatus: elements.projectStatus.value,
    notes: elements.notes.value.trim(),
  };

  if (editingId) {
    contracts = contracts.map((contract) => {
      if (contract.id !== editingId) return contract;
      return {
        ...contract,
        ...contractData,
        payments: [{ id: createId(), date: new Date().toISOString().slice(0, 10), amount: paid }],
      };
    });
  } else {
    contracts.unshift({
      id: createId(),
      ...contractData,
      payments: paid > 0 ? [{ id: createId(), date: new Date().toISOString().slice(0, 10), amount: paid }] : [],
    });
  }

  saveContracts();
  resetForm();
  render();
});

elements.paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const contractId = elements.paymentContract.value;
  const amount = Number(elements.paymentAmount.value || 0);
  if (!contractId || amount <= 0) return;

  contracts = contracts.map((contract) => {
    if (contract.id !== contractId) return contract;
    return {
      ...contract,
      payments: [...(contract.payments || []), { id: createId(), date: elements.paymentDate.value, amount }],
    };
  });

  elements.paymentAmount.value = "";
  saveContracts();
  render();
});

elements.cancelEditBtn.addEventListener("click", resetForm);
elements.searchInput.addEventListener("input", renderContracts);
elements.statusFilter.addEventListener("change", renderContracts);
elements.sortSelect.addEventListener("change", renderContracts);
elements.exportBtn.addEventListener("click", exportCsv);
elements.printBtn.addEventListener("click", () => window.print());

elements.paymentDate.value = new Date().toISOString().slice(0, 10);
render();
updateLiveBalance();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  });
}
