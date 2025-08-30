// ======== STATE ========
const DEPARTMENTS = ["IT", "Engineering", "CS", "Other"];
let employees = [
  { id:"EMP001", name:"Rajesh", manager:"Shruti", department:"Engineering", salary:750000 },
  { id:"EMP002", name:"Asha", manager:"Rohit", department:"HR", salary:520000 },
  { id:"EMP003", name:"Vikram", manager:"Meera", department:"Sales", salary:680000 },
];
let editingId = null;
let currentPage = 1;
const pageSize = 5;

// ======== ELEMENTS ========
const tableBody   = document.getElementById("employeeTable");
const totalCount  = document.getElementById("totalCount");
const statusMsg   = document.getElementById("statusMsg");

const modal       = document.getElementById("employeeModal");
const modalTitle  = document.getElementById("modalTitle");
const empId       = document.getElementById("empId");
const empName     = document.getElementById("empName");
const empManager  = document.getElementById("empManager");
const empDept     = document.getElementById("empDept");
const empSalary   = document.getElementById("empSalary");
const saveBtn     = document.getElementById("saveBtn");

const searchInput = document.getElementById("searchInput");

// Create pagination container dynamically
const paginationDiv = document.createElement("div");
paginationDiv.style.display = "flex";
paginationDiv.style.justifyContent = "center";
paginationDiv.style.gap = "10px";
paginationDiv.style.margin = "16px 0";
document.querySelector("main.container").appendChild(paginationDiv);

// ======== HELPERS ========
function showToast(msg){
  statusMsg.textContent = msg;
  setTimeout(()=> statusMsg.textContent="", 2000);
}
function nextId(){
  const max = employees.reduce((m,e)=>{
    const n = parseInt(e.id.replace(/\D/g,""))||0;
    return Math.max(m,n);
  },0);
  return "EMP" + String(max+1).padStart(3,"0");
}
function populateDepartments(){
  empDept.innerHTML = `<option value="">-- Select Department --</option>` +
    DEPARTMENTS.map(d=>`<option value="${d}">${d}</option>`).join("");
}

// ======== MODAL ========
function openModal(edit=false, rec=null){
  modal.classList.add("open");
  document.body.style.overflow="hidden";
  populateDepartments();
  
  if(edit && rec){
    modalTitle.textContent = "Edit Employee";
    editingId = rec.id;
    empId.value = rec.id;
    empName.value = rec.name;
    empManager.value = rec.manager;
    empDept.value = rec.department;
    empSalary.value = rec.salary;
  } else {
    modalTitle.textContent = "Add Employee";
    editingId = null;
    empId.value = nextId();
    empName.value = "";
    empManager.value = "";
    empDept.value = "";
    empSalary.value = "";
  }
  updateSaveBtnState(); 
  saveBtn.disabled = true; // सुरुवातीला नेहमी disable
  empName.focus();
}
function closeModal(){
  modal.classList.remove("open");
  document.body.style.overflow="";
}

// ======== SAVE BUTTON LOGIC ========
function updateSaveBtnState(){
  const filled = empName.value.trim() && empManager.value.trim() && empDept.value.trim() && empSalary.value.trim();
  
  if(filled){
    saveBtn.disabled = false;
    saveBtn.classList.add("blink");
  } else {
    saveBtn.disabled = true;
    saveBtn.classList.remove("blink");
  }
}
[empName, empManager, empDept, empSalary].forEach(el => el.addEventListener("input", updateSaveBtnState));

// ======== CRUD ========
function validate(){
  const name = empName.value.trim();
  const mgr  = empManager.value.trim();
  const dept = empDept.value.trim();
  const sal  = parseInt(empSalary.value,10);
  if(!name) return {ok:false,msg:"Name required"};
  if(!mgr)  return {ok:false,msg:"Manager required"};
  if(!dept) return {ok:false,msg:"Select department"};
  if(!(sal>=0)) return {ok:false,msg:"Salary must be 0 or more"};
  return {ok:true, data:{ id:empId.value, name, manager:mgr, department:dept, salary:sal }};
}
function upsertEmployee(emp){
  const idx = employees.findIndex(e=>e.id===emp.id);
  if(idx>=0){
    employees[idx]=emp;
    showToast("Employee updated");
  } else {
    employees.push(emp);
    showToast("Employee added");
    currentPage = Math.ceil(employees.length / pageSize);
  }
  renderTable();
}
function deleteEmployee(id){
  employees = employees.filter(e=>e.id!==id);
  showToast("Employee deleted");
  if((currentPage-1)*pageSize >= employees.length && currentPage>1){
    currentPage--; // move back if last page becomes empty
  }
  renderTable();
}

// ======== TABLE RENDER + PAGINATION ========
function renderTable(list=employees){
  tableBody.innerHTML = "";

  const start = (currentPage-1)*pageSize;
  const end   = start + pageSize;
  const pageData = list.slice(start,end);

  pageData.forEach((emp, indexOnPage)=>{
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.style.backgroundColor = "white"; // all rows white by default

    tr.addEventListener("mouseover", ()=>{
      if(indexOnPage % 2 === 0){
        tr.style.backgroundColor = "rgba(135, 206, 235, 0.4)"; // sky blue
      } else {
        tr.style.backgroundColor = "rgba(255, 165, 0, 0.4)";   // light orange
      }
    });
    tr.addEventListener("mouseout", ()=> tr.style.backgroundColor="white");

    tr.innerHTML = `
      <td><span class="badge">${emp.id}</span></td>
      <td>${emp.name}</td>
      <td>${emp.manager}</td>
      <td>${emp.department}</td>
      <td>₹ ${emp.salary.toLocaleString("en-IN")}</td>
      <td class="actions">
        <button class="icon-btn edit" onclick="openModal(true,${JSON.stringify(emp).replace(/"/g,'&quot;')})">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
        <button class="icon-btn delete" onclick="if(confirm('Delete ${emp.name}?'))deleteEmployee('${emp.id}')">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </td>`;
    tableBody.appendChild(tr);
  });
  totalCount.textContent = list.length;
  renderPagination(list);
}

function renderPagination(list){
  const totalPages = Math.ceil(list.length / pageSize) || 1;
  paginationDiv.innerHTML = `
    <button id="prevPage" class="icon-btn" ${currentPage===1?'disabled':''}>Prev</button>
    <span style="padding:8px 12px;font-weight:bold;">${currentPage}</span>
    <button id="nextPage" class="icon-btn" ${currentPage===totalPages?'disabled':''}>Next</button>
  `;
  document.getElementById("prevPage").onclick = ()=>{ if(currentPage>1){ currentPage--; renderTable(list);} };
  document.getElementById("nextPage").onclick = ()=>{ if(currentPage<totalPages){ currentPage++; renderTable(list);} };
}

// ======== FILTER / SEARCH ========
function applyFilter(){
  const q = searchInput.value.toLowerCase().trim();
  let filtered = employees.filter(e =>
    e.id.toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    e.manager.toLowerCase().includes(q) ||
    e.department.toLowerCase().includes(q)
  );
  
  const numQuery = parseInt(q,10);
  if(!isNaN(numQuery)){
    filtered = employees.filter(e =>
      e.salary.toString().includes(numQuery.toString()) ||
      e.id.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.manager.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  }
  
  currentPage = 1; 
  renderTable(filtered);
}

// ======== EVENTS ========
document.getElementById("addBtn").onclick = ()=>openModal(false);
document.getElementById("closeModalBtn").onclick = closeModal;
document.getElementById("cancelBtn").onclick = closeModal;
saveBtn.onclick = ()=>{
  const v = validate();
  if(!v.ok) return showToast(v.msg);
  upsertEmployee(v.data);
  closeModal();
};
searchInput.oninput = applyFilter;

// ======== INIT ========
renderTable();
populateDepartments();
updateSaveBtnState();
saveBtn.disabled = true; 
