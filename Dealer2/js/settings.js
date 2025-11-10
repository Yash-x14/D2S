// Settings Page Management
class SettingsPage {
    constructor() {
        this.init();
    }

    init() {
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }

        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePassword();
            });
        }

        this.loadProfile();
    }

    async loadProfile() {
        // Load dealer info from localStorage or API
        const dealerData = localStorage.getItem('dealerData');
        if (dealerData) {
            try {
                const dealer = JSON.parse(dealerData);
                document.getElementById('dealer-name').value = dealer.name || dealer.companyName || '';
                document.getElementById('dealer-email').value = dealer.email || '';
                document.getElementById('dealer-phone').value = dealer.phone || '';
            } catch (error) {
                console.error('Error parsing dealer data:', error);
            }
        }
    }

    async updateProfile() {
        const formData = {
            name: document.getElementById('dealer-name').value,
            email: document.getElementById('dealer-email').value,
            phone: document.getElementById('dealer-phone').value
        };

        try {
            await dealerAPI.updateProfile(formData);
            showNotification('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification(error.message || 'Failed to update profile', 'error');
        }
    }

    async updatePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            await dealerAPI.updateProfile({
                currentPassword,
                newPassword
            });
            showNotification('Password updated successfully!');
            document.getElementById('password-form').reset();
        } catch (error) {
            console.error('Error updating password:', error);
            showNotification(error.message || 'Failed to update password', 'error');
        }
    }
}

// Initialize settings page
window.settingsPage = new SettingsPage();