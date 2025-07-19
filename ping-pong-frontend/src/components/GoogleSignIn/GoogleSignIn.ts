import { setToken } from "../../utils/auth";

declare global {
  interface Window {
    google: any;
  }
}

export class GoogleSignIn {
  private onSuccess: (token: string) => void;
  private onError: (error: string) => void;
  private containerId: string; // <-- add this

  constructor(
    onSuccess: (token: string) => void,
    onError: (error: string) => void,
    containerId: string = 'google-signin-button' // <-- default value
  ) {
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.containerId = containerId; // <-- save it
    this.init();
  }

  private init() {
    if (window.google) {
      this.setupGoogleSignIn();
    } else {
      // Wait for Google script to load
      setTimeout(() => this.init(), 100);
    }
  }

  private setupGoogleSignIn() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not found in environment variables');
      this.onError('Google authentication not configured');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: this.handleGoogleSignIn.bind(this)
    });
    
    window.google.accounts.id.renderButton(
      document.getElementById(this.containerId), // <-- use the configurable ID
      {
        theme: 'outline',
        size: 'large',
        width: 300 // <-- Use a number, e.g. 300
      }
    );
  }

  private async handleGoogleSignIn(response: any) {
    try {
      const res = await fetch('/gateway/auth/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: response.credential }),
      });

      if (res.status === 200) {
        const json = await res.json();
        
        if (json.needsUsername) {
          // Show username selection modal
          this.showUsernameSelection(json.googleUser);
        } else if (json.token) {
          // User already exists, proceed with login
          setToken(json.token);
          this.onSuccess(json.token);
        } else {
          this.onError(json.error || 'Google authentication failed');
        }
      } else {
        const errorData = await res.json();
        this.onError(errorData.error || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      this.onError('Network error during Google authentication');
    }
  }

  private showUsernameSelection(googleUser: any) {
    // Create modal for username selection
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-96">
        <h2 class="text-xl font-bold mb-4">Choose Your Username</h2>
        <p class="text-gray-600 mb-4">Welcome ${googleUser.name}! Please choose a username for your account.</p>
        <input type="text" id="username-input" placeholder="Enter username" 
               class="w-full p-2 border border-gray-300 rounded mb-4" />
        <div class="flex justify-end space-x-2">
          <button id="cancel-btn" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
          <button id="confirm-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const usernameInput = modal.querySelector('#username-input') as HTMLInputElement;
    const confirmBtn = modal.querySelector('#confirm-btn') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;

    confirmBtn.addEventListener('click', async () => {
      const username = usernameInput.value.trim();
      if (username.length < 3) {
        alert('Username must be at least 3 characters');
        return;
      }

      try {
        const res = await fetch('/gateway/auth/google-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            username, 
            email: googleUser.email, 
            googleId: googleUser.sub 
          }),
        });

        if (res.status === 200) {
          const json = await res.json();
          setToken(json.token);
          document.body.removeChild(modal);
          this.onSuccess(json.token);
        } else {
          const errorData = await res.json();
          alert(errorData.error || 'Failed to create account');
        }
      } catch (error) {
        console.error('Username selection error:', error);
        alert('Network error during account creation');
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
} 