// Session configuration
const SESSION_TIMEOUT = 3600000; // 1 hour in milliseconds
const HEARTBEAT_INTERVAL = 300000; // 5 minutes

class AuthManager {
  static isLoggedIn() {
    const email = localStorage.getItem('loggedInEmail');
    const timestamp = localStorage.getItem('sessionTimestamp');
    
    if (!email || !timestamp) return false;
    
    // Check session expiration
    const sessionAge = Date.now() - parseInt(timestamp);
    if (sessionAge > SESSION_TIMEOUT) {
      this.logout();
      return false;
    }
    
    return true;
  }
  
  static requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  }
  
  static updateSessionTimestamp() {
    if (this.isLoggedIn()) {
      localStorage.setItem('sessionTimestamp', Date.now().toString());
    }
  }
  
  static logout() {
    // Clear all auth data
    localStorage.removeItem('loggedInEmail');
    localStorage.removeItem('sessionTimestamp');
    localStorage.removeItem('userRole');
    
    // Redirect to login
    window.location.href = '/login.html';
  }
  
  static async validateServerSession() {
    const email = localStorage.getItem('loggedInEmail');
    if (!email) return false;
    
    try {
      const response = await fetch('/.netlify/functions/validateSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(5000)
      });
      
      const result = await response.json();
      return result.valid;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }
  
  static startHeartbeat() {
    setInterval(() => {
      if (this.isLoggedIn()) {
        this.updateSessionTimestamp();
        this.validateServerSession().then(valid => {
          if (!valid) this.logout();
        });
      }
    }, HEARTBEAT_INTERVAL);
  }
}

// Validation utilities
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

// Toast notification system
function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// Loading state management
function setLoading(isLoading, buttonId = 'loginBtn') {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  
  const btnText = btn.querySelector('.btn-text') || btn;
  const spinner = btn.querySelector('.loading-spinner');
  
  btn.disabled = isLoading;
  
  if (spinner) {
    btnText.style.display = isLoading ? 'none' : 'inline';
    spinner.style.display = isLoading ? 'inline' : 'none';
  } else {
    btnText.textContent = isLoading ? '⟳ Loading...' : btnText.dataset.originalText || btnText.textContent;
  }
}

// Enhanced login function
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // Validation
  if (!email) {
    showToast('Email is required', 'error');
    return;
  }
  
  if (!validateEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  if (!password) {
    showToast('Password is required', 'error');
    return;
  }
  
  if (!validatePassword(password)) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }
  
  setLoading(true);
  
  try {
    const response = await fetch('/.netlify/functions/loginUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10000)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }
    
    if (result.success) {
      // Store session data
      localStorage.setItem('loggedInEmail', email);
      localStorage.setItem('sessionTimestamp', Date.now().toString());
      localStorage.setItem('userRole', result.user.Role || 'Parent');
      
      showToast('Login successful! Redirecting...', 'success');
      
      // Redirect after brief delay
      setTimeout(() => {
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = redirect || '/dashboard.html';
      }, 1000);
    } else {
      throw new Error(result.error || 'Invalid credentials');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.name === 'AbortError') {
      showToast('Request timed out. Please try again.', 'error');
    } else if (error.message.includes('Invalid credentials')) {
      showToast('Invalid email or password. Please try again.', 'error');
    } else {
      showToast('Something went wrong. Please try again.', 'error');
    }
  } finally {
    setLoading(false);
  }
}

// Password reset function
async function handlePasswordReset(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  
  if (!validateEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  setLoading(true, 'resetBtn');
  
  try {
    const response = await fetch('/.netlify/functions/resetPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(10000)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('Password reset link sent! Check your email.', 'success');
      document.getElementById('forgotPasswordForm').style.display = 'none';
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.innerHTML = `
        <div class="success-container">
          <div class="success-icon">✓</div>
          <h3 class="success-title">Check Your Email</h3>
          <p class="success-text">We've sent a password reset link to ${email}</p>
          <a href="/login.html" class="btn btn-secondary">Back to Login</a>
        </div>
      `;
      document.querySelector('.main-content').appendChild(successDiv);
    } else {
      throw new Error(result.error || 'Failed to send reset link');
    }
    
  } catch (error) {
    console.error('Password reset error:', error);
    showToast('Something went wrong. Please try again.', 'error');
  } finally {
    setLoading(false, 'resetBtn');
  }
}

// Auto-start heartbeat and initialize
document.addEventListener('DOMContentLoaded', () => {
  AuthManager.startHeartbeat();
  
  // Update session on user activity
  document.addEventListener('click', () => AuthManager.updateSessionTimestamp());
  document.addEventListener('keypress', () => AuthManager.updateSessionTimestamp());
  
  // Initialize login form if present
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    document.getElementById('email').focus();
  }
  
  // Initialize password reset form if present
  const resetForm = document.getElementById('forgotPasswordForm');
  if (resetForm) {
    resetForm.addEventListener('submit', handlePasswordReset);
  }
});
