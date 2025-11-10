// Test Submission Form Handler
(function() {
    'use strict';

    const form = document.getElementById('test-submission-form');
    const fillDemoBtn = document.getElementById('fill-demo-btn');
    const submitBtn = document.getElementById('submit-btn');
    const alertContainer = document.getElementById('alert-container');

    // Sample data arrays for generating random demo data
    const sampleNames = [
        'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 'David Brown',
        'Emily Davis', 'Robert Miller', 'Jessica Wilson', 'William Moore', 'Ashley Taylor',
        'James Anderson', 'Amanda Thomas', 'Daniel Jackson', 'Lisa White', 'Christopher Harris'
    ];

    const sampleFeedback = [
        'Great experience overall!',
        'The test was challenging but fair.',
        'I enjoyed the process.',
        'Could use some improvements.',
        'Excellent service and support.',
        'Very satisfied with the results.',
        'The test was well-structured.',
        'Would recommend to others.',
        'Met all my expectations.',
        'Outstanding quality and professionalism.'
    ];

    // Generate random demo data
    function fillDemoData() {
        const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
        const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
        const randomScore = Math.floor(Math.random() * 101); // 0-100
        const randomFeedback = sampleFeedback[Math.floor(Math.random() * sampleFeedback.length)];
        
        // Set current date/time as default
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

        // Fill form fields
        document.getElementById('name').value = randomName;
        document.getElementById('email').value = randomEmail;
        document.getElementById('testScore').value = randomScore;
        document.getElementById('feedback').value = randomFeedback;
        document.getElementById('date').value = dateTimeString;

        showAlert('Demo data filled successfully! Review and click Submit.', 'success');
    }

    // Show alert message
    function showAlert(message, type = 'success') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} show">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </div>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }
        }, 5000);
    }

    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            // Get form data
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                testScore: parseInt(document.getElementById('testScore').value),
                feedback: document.getElementById('feedback').value.trim(),
                date: document.getElementById('date').value || new Date().toISOString()
            };

            // Validate required fields
            if (!formData.name || !formData.email || formData.testScore === undefined) {
                throw new Error('Please fill in all required fields');
            }

            // Validate score range
            if (formData.testScore < 0 || formData.testScore > 100) {
                throw new Error('Test score must be between 0 and 100');
            }

            // Send data to backend
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/test/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit test data');
            }

            // Success!
            showAlert(
                `Success! ${data.message} Data ID: ${data.data.id}`,
                'success'
            );

            // Reset form after successful submission
            form.reset();

            console.log('Test data submitted successfully:', data);

        } catch (error) {
            console.error('Submission error:', error);
            showAlert(
                `Error: ${error.message}. Please check the console for details.`,
                'error'
            );
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
        }
    }

    // Event listeners
    fillDemoBtn.addEventListener('click', fillDemoData);
    form.addEventListener('submit', handleSubmit);

    // Auto-fill date with current date/time on page load
    window.addEventListener('DOMContentLoaded', () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('date').value = dateTimeString;
    });

})();

