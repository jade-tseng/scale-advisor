class ScaleAdvisorClient {
    constructor() {
        this.baseUrl = 'http://localhost:8080';
        this.currentTool = null;
        this.sessionId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkServerConnection();
    }

    setupEventListeners() {
        // Tool card selection
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectTool(card.dataset.tool);
            });
        });
    }

    async checkServerConnection() {
        const statusElement = document.getElementById('connection-status');
        try {
            // Check health endpoint
            const response = await fetch(`${this.baseUrl}/health`);
            if (response.ok) {
                statusElement.className = 'status-connected';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
                // Initialize MCP session
                await this.initializeMCPSession();
            } else {
                throw new Error('Server not responding');
            }
        } catch (error) {
            statusElement.className = 'status-disconnected';
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
            console.warn('MCP Server not available:', error.message);
        }
    }

    selectTool(toolName) {
        // Update UI
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-tool="${toolName}"]`).classList.add('selected');

        this.currentTool = toolName;
        this.renderInputForm(toolName);
    }

    renderInputForm(toolName) {
        const formsContainer = document.getElementById('input-forms');
        const forms = {
            'github_analyze_repository': this.createGitHubAnalyzerForm(),
            'analyze_cloud_resources': this.createCloudAnalyzerForm(),
            'analyze_security_posture': this.createSecurityAnalyzerForm(),
            'generate_terraform_infrastructure': this.createInfraGenForm(),
            'create_github_pr': this.createGitHubPRForm(),
            'analyze_repository_and_cloud': this.createComprehensiveAnalysisForm()
        };

        formsContainer.innerHTML = forms[toolName] || '<p>Form not available for this tool.</p>';
        
        // Add form submission handler
        const form = formsContainer.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.executeTool(toolName, new FormData(form));
            });
        }
    }

    createGitHubAnalyzerForm() {
        return `
            <form class="tool-form">
                <h3><i class="fab fa-github"></i> GitHub Repository Analysis</h3>
                <div class="form-group">
                    <label for="repository_url">Repository URL</label>
                    <input type="url" id="repository_url" name="repository_url" 
                           placeholder="https://github.com/owner/repo" required>
                </div>
                <div class="form-group">
                    <label for="analysis_depth">Analysis Depth</label>
                    <select id="analysis_depth" name="analysis_depth">
                        <option value="basic">Basic</option>
                        <option value="detailed">Detailed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="include_dependencies" checked>
                        Include Dependencies Analysis
                    </label>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-search"></i> Analyze Repository
                </button>
            </form>
        `;
    }

    createCloudAnalyzerForm() {
        return `
            <form class="tool-form">
                <h3><i class="fas fa-cloud"></i> Cloud Resource Analysis</h3>
                <div class="form-group">
                    <label for="cloud_provider">Cloud Provider</label>
                    <select id="cloud_provider" name="cloud_provider" required>
                        <option value="aws">Amazon Web Services (AWS)</option>
                        <option value="azure">Microsoft Azure</option>
                        <option value="gcp">Google Cloud Platform</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="resource_types">Resource Types (comma-separated)</label>
                    <input type="text" id="resource_types" name="resource_types" 
                           placeholder="ec2, rds, s3, lambda" required>
                </div>
                <div class="form-group">
                    <label for="region">Region</label>
                    <input type="text" id="region" name="region" 
                           placeholder="us-east-1" required>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-chart-line"></i> Analyze Cloud Resources
                </button>
            </form>
        `;
    }

    createSecurityAnalyzerForm() {
        return `
            <form class="tool-form">
                <h3><i class="fas fa-shield-alt"></i> Security Posture Analysis</h3>
                <div class="form-group">
                    <label for="target_type">Analysis Target</label>
                    <select id="target_type" name="target_type" required>
                        <option value="repository">GitHub Repository</option>
                        <option value="infrastructure">Cloud Infrastructure</option>
                        <option value="both">Both Repository & Infrastructure</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="repository_url">Repository URL (if applicable)</label>
                    <input type="url" id="repository_url" name="repository_url" 
                           placeholder="https://github.com/owner/repo">
                </div>
                <div class="form-group">
                    <label for="cloud_provider">Cloud Provider (if applicable)</label>
                    <select id="cloud_provider" name="cloud_provider">
                        <option value="">Select provider</option>
                        <option value="aws">AWS</option>
                        <option value="azure">Azure</option>
                        <option value="gcp">GCP</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-search"></i> Analyze Security
                </button>
            </form>
        `;
    }

    createInfraGenForm() {
        return `
            <form class="tool-form">
                <h3><i class="fas fa-code"></i> Terraform Infrastructure Generation</h3>
                <div class="form-group">
                    <label for="repository_url">Repository URL</label>
                    <input type="url" id="repository_url" name="repository_url" 
                           placeholder="https://github.com/owner/repo" required>
                </div>
                <div class="form-group">
                    <label for="cloud_provider">Target Cloud Provider</label>
                    <select id="cloud_provider" name="cloud_provider" required>
                        <option value="aws">Amazon Web Services (AWS)</option>
                        <option value="azure">Microsoft Azure</option>
                        <option value="gcp">Google Cloud Platform</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="environment">Environment</label>
                    <select id="environment" name="environment">
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="scaling_requirements">Scaling Requirements</label>
                    <textarea id="scaling_requirements" name="scaling_requirements" 
                              placeholder="Describe expected traffic, performance requirements, etc."></textarea>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-cogs"></i> Generate Infrastructure
                </button>
            </form>
        `;
    }

    createGitHubPRForm() {
        return `
            <form class="tool-form">
                <h3><i class="fas fa-code-branch"></i> Create GitHub Pull Request</h3>
                <div class="form-group">
                    <label for="repository_url">Repository URL</label>
                    <input type="url" id="repository_url" name="repository_url" 
                           placeholder="https://github.com/owner/repo" required>
                </div>
                <div class="form-group">
                    <label for="github_token">GitHub Token</label>
                    <input type="password" id="github_token" name="github_token" 
                           placeholder="ghp_xxxxxxxxxxxx">
                    <small>Leave empty to use GITHUB_TOKEN environment variable</small>
                </div>
                <div class="form-group">
                    <label for="branch_name">Branch Name</label>
                    <input type="text" id="branch_name" name="branch_name" 
                           value="feature/terraform-infrastructure">
                </div>
                <div class="form-group">
                    <label for="pr_title">Pull Request Title</label>
                    <input type="text" id="pr_title" name="pr_title" 
                           value="Add Terraform Infrastructure Configuration">
                </div>
                <div class="form-group">
                    <label for="infra_directory">Infrastructure Directory</label>
                    <input type="text" id="infra_directory" name="infra_directory" 
                           value="infra-gen">
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-upload"></i> Create Pull Request
                </button>
            </form>
        `;
    }

    createComprehensiveAnalysisForm() {
        return `
            <form class="tool-form">
                <h3><i class="fas fa-chart-line"></i> Comprehensive Analysis</h3>
                <div class="form-group">
                    <label for="repository_url">Repository URL</label>
                    <input type="url" id="repository_url" name="repository_url" 
                           placeholder="https://github.com/owner/repo" required>
                </div>
                <div class="form-group">
                    <label for="cloud_provider">Cloud Provider</label>
                    <select id="cloud_provider" name="cloud_provider" required>
                        <option value="aws">Amazon Web Services (AWS)</option>
                        <option value="azure">Microsoft Azure</option>
                        <option value="gcp">Google Cloud Platform</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="include_security" checked>
                        Include Security Analysis
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="generate_infrastructure" checked>
                        Generate Infrastructure Code
                    </label>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-rocket"></i> Run Comprehensive Analysis
                </button>
            </form>
        `;
    }

    async initializeMCPSession() {
        try {
            const response = await fetch(`${this.baseUrl}/mcp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'initialize',
                    params: {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: {
                            name: 'scale-advisor-frontend',
                            version: '1.0.0'
                        }
                    }
                })
            });
            
            if (response.ok) {
                const sessionId = response.headers.get('mcp-session-id');
                if (sessionId) {
                    this.sessionId = sessionId;
                    console.log('MCP session initialized:', sessionId);
                    
                    // Send initialized notification
                    await this.sendInitializedNotification();
                }
            }
        } catch (error) {
            console.warn('Failed to initialize MCP session:', error);
        }
    }

    async sendInitializedNotification() {
        try {
            await fetch(`${this.baseUrl}/mcp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream',
                    'mcp-session-id': this.sessionId
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'notifications/initialized'
                })
            });
        } catch (error) {
            console.warn('Failed to send initialized notification:', error);
        }
    }

    async executeTool(toolName, formData) {
        this.showLoading(true);
        
        try {
            // Convert FormData to object
            const params = {};
            for (let [key, value] of formData.entries()) {
                if (value === 'on') value = true; // Convert checkboxes
                if (value !== '') params[key] = value;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
            };
            
            if (this.sessionId) {
                headers['mcp-session-id'] = this.sessionId;
            }

            const response = await fetch(`${this.baseUrl}/mcp`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: {
                        name: toolName,
                        arguments: params
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            
            // Parse SSE format response
            let result;
            if (responseText.startsWith('event: message\ndata: ')) {
                // Extract JSON from SSE format
                const jsonData = responseText.replace('event: message\ndata: ', '').trim();
                result = JSON.parse(jsonData);
            } else {
                // Regular JSON response
                result = JSON.parse(responseText);
            }
            
            if (result.error) {
                throw new Error(result.error.message || 'Tool execution failed');
            }
            
            this.displayResults(result.result);
            
        } catch (error) {
            this.displayError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        const messages = {
            'github_analyze_repository': 'Analyzing GitHub repository...',
            'analyze_cloud_resources': 'Analyzing cloud resources...',
            'analyze_security_posture': 'Analyzing security posture...',
            'generate_terraform_infrastructure': 'Generating Terraform code...',
            'create_github_pr': 'Creating GitHub pull request...',
            'analyze_repository_and_cloud': 'Running comprehensive analysis...'
        };

        if (show) {
            document.getElementById('loading-message').textContent = 
                messages[this.currentTool] || 'Processing request...';
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    displayResults(result) {
        const container = document.getElementById('results-container');
        
        if (result.isError) {
            this.displayError(result.content[0]?.text || 'Unknown error occurred');
            return;
        }

        const content = result.content[0]?.text || 'No content returned';
        
        container.innerHTML = `
            <div class="result-card success">
                <div class="result-header">
                    <h3><i class="fas fa-check-circle"></i> Analysis Complete</h3>
                    <span class="timestamp">${new Date().toLocaleString()}</span>
                </div>
                <div class="result-content">
                    <pre>${this.formatContent(content)}</pre>
                </div>
                <div class="result-actions">
                    <button onclick="this.copyToClipboard('${content.replace(/'/g, "\\'")}')">
                        <i class="fas fa-copy"></i> Copy Results
                    </button>
                    <button onclick="this.downloadResults('${content.replace(/'/g, "\\'")}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
    }

    displayError(message) {
        const container = document.getElementById('results-container');
        container.innerHTML = `
            <div class="result-card error">
                <div class="result-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                    <span class="timestamp">${new Date().toLocaleString()}</span>
                </div>
                <div class="result-content">
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    formatContent(content) {
        // Basic markdown-like formatting
        return content
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success message
            const btn = event.target;
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    }

    downloadResults(content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scale-advisor-results-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.scaleAdvisor = new ScaleAdvisorClient();
});

// Global functions for button actions
window.copyToClipboard = function(text) {
    window.scaleAdvisor.copyToClipboard(text);
};

window.downloadResults = function(content) {
    window.scaleAdvisor.downloadResults(content);
};
