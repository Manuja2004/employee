let employees = [];

const deptColors = {
    'it': { avatar: 'avatar-blue', badge: 'badge-blue' },
    'engineering': { avatar: 'avatar-blue', badge: 'badge-blue' },
    'hr': { avatar: 'avatar-purple', badge: 'badge-purple' },
    'human resources': { avatar: 'avatar-purple', badge: 'badge-purple' },
    'sales': { avatar: 'avatar-green', badge: 'badge-green' },
    'finance': { avatar: 'avatar-orange', badge: 'badge-orange' }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchEmployees();
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-edit').addEventListener('click', handleEdit);
    document.getElementById('btn-clear').addEventListener('click', clearForm);
    // document.getElementById('btn-update-list').addEventListener('click', fetchEmployees);
});

async function fetchEmployees() {
    try {
        // Try to get from localStorage first
        const stored = localStorage.getItem('employees');
        if (stored) {
            employees = JSON.parse(stored);
            // Check if schema matches (e.g., missing basicSalary or variance is 0 when salary > 0). If so, reload from JSON.
            if (employees.length > 0 && (typeof employees[0].basicSalary === 'undefined' || employees.some(e => e.variance === 0 && (e.basicSalary + e.variance) > 0))) {
                employees = []; // invalidates, forces fetch below
            }
        }

        if (!employees || employees.length === 0) {
            // First time load or empty storage: fetch from JSON
            const res = await fetch('employees.json').catch(() => null);
            employees = res ? await res.json() : [];
            // Ensure IDs are numbers and save to storage
            employees = employees.map(emp => ({
                ...emp,
                id: Number(emp.id),
                phone: emp.phone || '',
                basicSalary: Number(emp.basicSalary || emp.salary || 0),
                variance: Number(emp.variance || 0)
            }));
            localStorage.setItem('employees', JSON.stringify(employees));
        }
        renderTable();
    } catch (e) {
        console.error('Data error:', e);
    }
}

function renderTable() {
    const tbody = document.getElementById('employee-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    employees.forEach(emp => {
        const row = document.createElement('tr');
        const colors = getColors(emp.department);
        const initials = getInitials(emp.fullName);
        const date = new Date(emp.joinDate).toLocaleDateString('en-US', { dateStyle: 'medium' });
        const basic = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(emp.basicSalary || 0);
        const variance = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(emp.variance || 0);
        const totalSalary = (emp.basicSalary || 0) + (emp.variance || 0);
        const salary = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalSalary);

        row.innerHTML = `
            <td class="font-medium">${emp.id}</td>
            <td><div class="user-cell"><div class="avatar-initial ${colors.avatar}">${initials}</div><span>${emp.fullName}</span></div></td>
            <td>${emp.email}</td>
            <td>${emp.phone}</td>
            <td><span class="badge ${colors.badge}">${emp.department}</span></td>
            <td>${emp.role}</td>
            <td>${date}</td>
            <td>${emp.lastUpdated ? new Date(emp.lastUpdated).toLocaleString() : 'N/A'}</td>
            <td class="text-right font-medium">${salary}</td>
        `;
        tbody.appendChild(row);
    });

}

function handleSave(e) {
    e.preventDefault();
    const data = getFormData();
    if (!data.id || !data.fullName || !data.email) return alert('ID, Name, and Email are required.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return alert('Please enter a valid email address.');
    }

    const idx = employees.findIndex(emp => emp.id === data.id);
    const now = new Date().toISOString();

    if (idx !== -1) {
        alert('Employee ID already exists. Use the Edit button to update details.');
        return;
    }

    employees.push({ ...data, lastUpdated: now });
    renderTable();
    clearForm();
}

function handleEdit(e) {
    e.preventDefault();
    const id = document.getElementById('emp-id').value;
    if (!id) {
        alert('Please enter an Employee ID to edit.');
        return;
    }
    window.open(`edit.html?id=${id}`, '_blank');
}



window.editEmployee = (id) => {
    const emp = employees.find(e => e.id === Number(id));
    if (!emp) return;

    // Populate fields
    const map = { name: 'fullName', date: 'joinDate' };
    ['id', 'name', 'email', 'phone', 'dept', 'role', 'date', 'salary'].forEach(field => {
        const key = map[field] || field;
        const el = document.getElementById(`emp-${field}`);
        if (el) el.value = emp[key] || '';
    });

    document.querySelector('.employee-form').scrollIntoView({ behavior: 'smooth' });
};

window.deleteEmployee = (id) => {
    if (confirm('Delete this employee?')) {
        employees = employees.filter(e => e.id !== Number(id));
        renderTable();
        if (Number(document.getElementById('emp-id').value) === Number(id)) clearForm();
    }
};

function clearForm(e) {
    if (e) e.preventDefault();
    document.querySelector('.employee-form').reset();
    document.getElementById('emp-dept').value = "";
}

function getFormData() {
    const getVal = (id) => document.getElementById(id).value;
    return {
        id: Number(getVal('emp-id')),
        fullName: getVal('emp-name'),
        email: getVal('emp-email'),
        phone: document.getElementById('emp-country-code').value + ' ' + document.getElementById('emp-phone').value,
        department: getVal('emp-dept'),
        role: getVal('emp-role'),
        joinDate: getVal('emp-date'),
        basicSalary: Number(getVal('emp-salary')),
        variance: 0
    };
}

function getColors(dept) {
    return deptColors[(dept || '').toLowerCase()] || { avatar: 'avatar-blue', badge: 'badge-blue' };
}

function getInitials(name) {
    return (name || '??').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}


