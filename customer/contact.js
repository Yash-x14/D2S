// Contact page (contact.html) specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Contact form submission handler
    const contactForm = document.querySelector('.feedback-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form fields
            const name = this.querySelector('input[type="text"]').value.trim();
            const email = this.querySelector('input[type="email"]').value.trim();
            const phone = this.querySelector('input[type="tel"]').value.trim();
            const message = this.querySelector('textarea').value.trim();
            
            // Validate required fields
            if (!name || !email || !message) {
                alert('Please fill in all required fields (Name, Email, Message).');
                return;
            }
            
            // Disable submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'SENDING...';
            
            try {
                const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
                const userId = getUserId(); // Get customer ID if logged in
                const token = getToken();
                
                const response = await fetch(`${API_BASE_URL}/api/contact/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        message,
                        customerId: userId || null // Link to customer if logged in
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to submit contact form');
                }
                
                // Success
                alert('Thank you for contacting us! We will get back to you soon.');
                this.reset();
                
                console.log('Contact form submitted successfully:', data);
            } catch (error) {
                console.error('Contact form error:', error);
                alert('Error submitting form. Please try again later.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});