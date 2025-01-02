document.addEventListener('DOMContentLoaded', () => {
    const baseUrl = 'http://localhost:3000';

   
    document.getElementById('add-patient-form').addEventListener('submit', async function(e) {
        e.preventDefault();
    
        const name = document.getElementById('patient-name').value;
        const email = document.getElementById('patient-email').value;
        const phoneNumber = document.getElementById('patient-phone').value;
        const wallet = document.getElementById('patient-wallet').value || 0;
    
        const patientData = { name, email, phoneNumber, wallet };
    
        try {
            const response = await fetch(`${baseUrl}/add-patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData),
            });
    
            const result = await response.json();
            console.log('Response from Backend:', result);
    
         
            if (response.ok && result.patientId) {
                alert(`Patient added successfully. Patient ID: ${result.patientId}`);
            } else {
                console.error('Error in Response:', result);
                alert(`Error: ${result.error || 'Failed to add patient'}`);
            }
        } catch (error) {
            console.error('Network Error:', error.message);
            alert('Failed to add patient. Please try again.');
        }
    });
    document.getElementById('book-appointment-form').addEventListener('submit', async function(e) {
        e.preventDefault();
    
        const patientId = document.getElementById('patient-id').value.trim();
        const doctorId = document.getElementById('doctor-id').value;
        const date = document.getElementById('appointment-date').value;
    
        const appointmentData = { patientId, doctorId, date };
    
        try {
            const response = await fetch(`${baseUrl}/book-appointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentData),
            });
    
            const result = await response.json();
            console.log('Response from Backend:', result);
    
           
            if (response.ok) {
                alert(result.message || 'Appointment booked successfully');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error.message);
            alert('Error: ' + error.message);
        }
    });
    
    document.getElementById('view-report').addEventListener('click', async function() {
        try {
            const response = await fetch(`${baseUrl}/financial-report`);
            const report = await response.json();

            let reportHtml = '<ul>';
            report.forEach(item => {
                reportHtml += `
                    <li>
                        Patient: ${item.patient}, Doctor: ${item.doctor}, Date: ${new Date(item.date).toLocaleDateString()}, Discounted: ${item.discounted}
                    </li>
                `;
            });
            reportHtml += '</ul>';

            document.getElementById('financial-report').innerHTML = reportHtml;
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
   
async function fetchDoctors() {
    try {
     
        const response = await fetch('http://localhost:3000/doctors'); 
        if (response.ok) {
            const doctors = await response.json();
            console.log('Doctors fetched:', doctors); 

           
            const tableBody = document.querySelector('#doctors-table tbody');
            tableBody.innerHTML = ''; 

         
            doctors.forEach(doctor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${doctor._id}</td>
                    <td>${doctor.name}</td>
                    <td>${doctor.specialization}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Error fetching doctors:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fetchDoctors();


});
