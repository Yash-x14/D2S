// Personal Information Page
document.addEventListener('DOMContentLoaded', function() {
    initializePersonalInfoPage();
});

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';

function getToken() {
    return localStorage.getItem('token') || '';
}

function getUserId() {
    return localStorage.getItem('userId') || '';
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function initializePersonalInfoPage() {
    // Check if user is logged in
    const token = getToken();
    const userId = getUserId();

    if (!token || !userId) {
        showNotification('Please login to view your personal information', 'error');
        setTimeout(() => {
            window.location.href = '/auth';
        }, 2000);
        return;
    }

    // Load user profile
    await loadUserProfile();

    // Attach event listeners
    attachPersonalInfoEventListeners();

    // Update cart count
    updateCartCount();
}

async function loadUserProfile() {
    try {
        const token = getToken();
        
        // Try to load from API first
        let customer = null;
        try {
            const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                customer = data.data?.customer;
            }
        } catch (apiError) {
            console.warn('API load failed, using localStorage fallback:', apiError);
        }

        // Fallback to localStorage if API fails (for registration data)
        if (!customer) {
            const storedName = localStorage.getItem('customerName');
            const storedEmail = localStorage.getItem('customerEmail');
            
            if (storedName || storedEmail) {
                customer = {
                    name: storedName || '',
                    email: storedEmail || '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'India',
                    dateOfBirth: null,
                    gender: '',
                    language: 'en',
                    currency: 'INR',
                    newsletter: false,
                    smsNotifications: false,
                    emailNotifications: true,
                    createdAt: new Date()
                };
            }
        }

        if (!customer) {
            throw new Error('Customer data not found');
        }

        // Update profile summary
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileMemberSince = document.getElementById('profile-member-since');

        if (profileName) profileName.textContent = customer.name || 'Customer';
        if (profileEmail) profileEmail.textContent = customer.email || '';
        
        if (customer.createdAt) {
            const memberSince = new Date(customer.createdAt);
            if (profileMemberSince) {
                profileMemberSince.textContent = `Member since ${memberSince.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}`;
            }
        }

        // Populate form fields - automatically fill username, email from registration
        const form = document.getElementById('personal-info-form');
        if (form) {
            // Basic Information - Auto-populate from registration
            const nameField = form.querySelector('#name');
            const emailField = form.querySelector('#email');
            
            if (nameField) {
                nameField.value = customer.name || localStorage.getItem('customerName') || '';
            }
            if (emailField) {
                emailField.value = customer.email || localStorage.getItem('customerEmail') || '';
            }
            
            // Other fields
            if (customer.phone) form.querySelector('#phone').value = customer.phone;
            if (customer.dateOfBirth) {
                const dob = new Date(customer.dateOfBirth);
                form.querySelector('#dateOfBirth').value = dob.toISOString().split('T')[0];
            }
            if (customer.gender) form.querySelector('#gender').value = customer.gender;

            // Address Information
            if (customer.address) form.querySelector('#address').value = customer.address;
            if (customer.city) form.querySelector('#city').value = customer.city;
            if (customer.state) form.querySelector('#state').value = customer.state;
            if (customer.zipCode) form.querySelector('#zipCode').value = customer.zipCode;
            if (customer.country) form.querySelector('#country').value = customer.country;

            // Preferences
            if (customer.language) form.querySelector('#language').value = customer.language;
            if (customer.currency) form.querySelector('#currency').value = customer.currency;

            // Notification Preferences
            form.querySelector('#newsletter').checked = customer.newsletter || false;
            form.querySelector('#emailNotifications').checked = customer.emailNotifications !== false;
            form.querySelector('#smsNotifications').checked = customer.smsNotifications || false;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile information', 'error');
    }
}

function attachPersonalInfoEventListeners() {
    const form = document.getElementById('personal-info-form');
    if (form) {
        form.addEventListener('submit', handleProfileUpdate);
    }

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                loadUserProfile();
            }
        });
    }

    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            showNotification('Avatar change feature coming soon!', 'info');
        });
    }

    // Password validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
}

function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (newPassword && confirmPassword) {
        if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Get password fields
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    // Validate passwords if provided
    if (newPassword || currentPassword) {
        if (!currentPassword || !newPassword) {
            showNotification('Both current and new password are required to change password', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('New password must be at least 6 characters long', 'error');
            return;
        }
    }

    // Prepare update data
    const updateData = {
        name: formData.get('name') || '',
        phone: formData.get('phone') || '',
        address: formData.get('address') || '',
        city: formData.get('city') || '',
        state: formData.get('state') || '',
        zipCode: formData.get('zipCode') || '',
        country: formData.get('country') || 'India',
        dateOfBirth: formData.get('dateOfBirth') || null,
        gender: formData.get('gender') || '',
        language: formData.get('language') || 'en',
        currency: formData.get('currency') || 'INR',
        newsletter: formData.get('newsletter') === 'on',
        emailNotifications: formData.get('emailNotifications') === 'on',
        smsNotifications: formData.get('smsNotifications') === 'on'
    };

    // Add password fields if provided
    if (currentPassword && newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
    }

    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update profile');
        }

        showNotification('Profile updated successfully!', 'success');
        
        // Reload profile to show updated data
        await loadUserProfile();
        
        // Clear password fields
        form.querySelector('#currentPassword').value = '';
        form.querySelector('#newPassword').value = '';
        form.querySelector('#confirmPassword').value = '';

    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification(error.message || 'Failed to update profile', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

