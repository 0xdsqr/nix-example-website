class EmailForm extends HTMLElement {
  constructor() {
    super();
  }

  // Called when the component connects to the DOM
  connectedCallback() {
    this.render();
  }

  saveEmail(event) {
    // Don't actually submit the form
    event.preventDefault();

    const emailInput = this.querySelector("#email-form #email");
    const email = emailInput.value;
    
    // Show loading state
    const button = this.querySelector("#email-form button");
    const originalText = button.textContent;
    button.textContent = "Saving...";
    button.disabled = true;

    // Send the email to our API
    fetch('/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email }),
    }).then(response => {
      if (response.ok) {
        this.showMessage("Email saved successfully!", "success");
        emailInput.value = ""; // Clear the input
      } else {
        return response.text().then(text => {
          this.showMessage(`Error: ${text}`, "error");
        });
      }
    }).catch(error => {
      this.showMessage(`Error: ${error.message}`, "error");
    }).finally(() => {
      // Restore button state
      button.textContent = originalText;
      button.disabled = false;
    });
  }

  showMessage(message, type) {
    const messageEl = this.querySelector(".message");
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = "block";
    
    // Hide message after 5 seconds
    setTimeout(() => {
      messageEl.style.display = "none";
    }, 5000);
  }

  render() {
    this.innerHTML = `
      <div class="email-container">
        <div class="message" style="display: none;"></div>
        <form id="email-form">
          <input type="email" id="email" placeholder="Enter your email" required />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    `;

    this.querySelector("#email-form").addEventListener('submit', this.saveEmail.bind(this));
  }
}

class HealthStatus extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.checkHealth();
  }

  checkHealth() {
    fetch('/health/status')
      .then(response => {
        if (response.ok) {
          return response.text();
        }
        throw new Error('Health check failed');
      })
      .then(text => {
        this.updateStatus(true, text);
      })
      .catch(error => {
        this.updateStatus(false, error.message);
      });
  }

  updateStatus(isHealthy, message) {
    const statusEl = this.querySelector('.status');
    const indicatorEl = this.querySelector('.indicator');

    if (isHealthy) {
      statusEl.textContent = `Status: ${message}`;
      indicatorEl.className = 'indicator healthy';
    } else {
      statusEl.textContent = `Status: Error - ${message}`;
      indicatorEl.className = 'indicator unhealthy';
    }
  }

  render() {
    this.innerHTML = `
      <div class="health-container">
        <h3>Server Health</h3>
        <div class="status-row">
          <div class="indicator"></div>
          <div class="status">Checking server health...</div>
        </div>
      </div>
    `;
  }
}

// Register the custom elements
customElements.define('email-form', EmailForm);
customElements.define('health-status', HealthStatus);
