document.addEventListener('DOMContentLoaded', async () => {
    // Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        alert('No employee ID provided');
        window.location.href = 'index.html';
        return;
    }

    // Load Data
    // Load Data
    let employees = JSON.parse(localStorage.getItem('employees') || '[]');

    // Check if stale (missing basicSalary or variance is 0 when salary > 0) and reload from JSON if needed
    if (employees.length === 0 ||
        typeof employees[0].basicSalary === 'undefined' ||
        employees.some(e => e.variance === 0 && e.salary > 0)) {
        try {
            const res = await fetch('employees.json');
            if (res.ok) {
                employees = await res.json();
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
        } catch (e) {
            console.error('Failed to load employee data:', e);
        }
    }

    const emp = employees.find(e => e.id === Number(id));

    if (!emp) {
        alert('Employee not found');
        window.location.href = 'index.html';
        return;
    }

    // Populate Form
    document.getElementById('emp-id').textContent = emp.id;
    document.getElementById('emp-name').textContent = emp.fullName;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-email').value = emp.email;

    // Split phone into country code and number
    const phoneFull = emp.phone || '';
    // Regex matches (+Digits) followed by space(optional) and keys
    // Example: "+91 9876543210" -> group1="+91", group2="9876543210"
    const phoneMatch = phoneFull.match(/^(\+\d+)\s*(.*)$/);
    if (phoneMatch) {
        document.getElementById('emp-country-code').value = phoneMatch[1];
        document.getElementById('emp-phone').value = phoneMatch[2].replace(/\s/g, '');
    } else {
        document.getElementById('emp-phone').value = phoneFull;
    }

    document.getElementById('emp-dept').value = emp.department;
    document.getElementById('emp-role').value = emp.role;

    document.getElementById('emp-basic-salary').value = emp.basicSalary || '';
    document.getElementById('emp-variance').value = emp.variance || 0;

    // Initial Calc
    const updateNetSalary = () => {
        const basic = Number(document.getElementById('emp-basic-salary').value) || 0;
        const variance = Number(document.getElementById('emp-variance').value) || 0;
        document.getElementById('emp-salary').value = basic + variance;
    };
    updateNetSalary();

    // Listeners
    document.getElementById('emp-basic-salary').addEventListener('input', updateNetSalary);
    document.getElementById('emp-variance').addEventListener('input', updateNetSalary);

    // Handle Save
    document.getElementById('btn-update').addEventListener('click', (e) => {
        e.preventDefault();

        const email = document.getElementById('emp-email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return alert('Please enter a valid email address.');
        }

        // Update Object
        const updatedEmp = {
            ...emp,
            // fullName preserved from existing record via ...emp
            email: email,
            email: email,
            phone: document.getElementById('emp-country-code').value + ' ' + document.getElementById('emp-phone').value,
            department: document.getElementById('emp-dept').value,
            role: document.getElementById('emp-role').value,
            // joinDate preserved from existing record via ...emp
            basicSalary: Number(document.getElementById('emp-basic-salary').value),
            variance: Number(document.getElementById('emp-variance').value),
            lastUpdated: new Date().toISOString()
        };

        // Save to Storage
        const idx = employees.findIndex(e => e.id === Number(id));
        if (idx !== -1) {
            employees[idx] = updatedEmp;
            localStorage.setItem('employees', JSON.stringify(employees));
            alert('Employee updated successfully!');
            window.location.href = 'index.html';
        }
    });
});
