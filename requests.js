// Add a new object to store request-specific phase data
const requestPhasesData = {
    'REQ000104490': {
        phases: [
            // Copy the existing mockData.phases structure for this request
            // This will store the phases and milestones for each request
        ]
    }
};

function renderPhaseCell(phase) {
    if (phase.type === 'new') {
        return `
            <div class="phase-chip phase-new">
                <span class="material-symbols-rounded">${phase.icon}</span>
                ${phase.label}
            </div>
        `;
    }

    const indicators = phase.indicators?.map(status => {
        const icon = status === 'completed' ? 'check_circle' : 'schedule';
        const className = `status-${status}`;
        return `<span class="material-symbols-rounded ${className}">${icon}</span>`;
    }).join('') || '';

    return `
        <div class="phase-chip phase-${phase.type}">
            ${phase.label}
            ${indicators}
        </div>
    `;
}

function renderRequests() {
    const tbody = document.getElementById('requests-body');
    tbody.innerHTML = requestsData.map(request => `
        <tr data-request-id="${request.requestId}">
            <td>${request.requestId}</td>
            <td>${request.physician}</td>
            <td>${request.institution}</td>
            <td>${request.country}</td>
            <td>${request.owner}</td>
            <td>${renderPhaseCell(request.phase)}</td>
            <td>
                ${request.comments ? `
                    <div class="comment-text">
                        <span class="comment-author">${request.comments.author}:</span>
                        ${request.comments.text}
                    </div>
                ` : ''}
            </td>
        </tr>
    `).join('');

    // Add click handlers to rows
    tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', () => {
            const requestId = row.dataset.requestId;
            showRequestDetails(requestId);
        });
    });
}

function showRequestDetails(requestId) {
    const sidePanel = document.querySelector('.side-panel');
    const iframe = document.getElementById('details-frame');
    
    // Save the current phases data if we're switching requests
    const currentRequestId = new URLSearchParams(iframe.src).get('id');
    if (currentRequestId && currentRequestId !== requestId) {
        const message = {
            type: 'save-phases',
            phases: requestPhasesData[currentRequestId]
        };
        iframe.contentWindow.postMessage(message, '*');
    }
    
    // Load the details page with the specific request
    iframe.src = `request-details.html?id=${requestId}`;
    sidePanel.classList.add('open');
}

// Add close functionality
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sidePanel = document.querySelector('.side-panel');
        sidePanel.classList.remove('open');
    }
});

// Message handlers for iframe communication
window.addEventListener('message', (event) => {
    if (event.data.type === 'phase-update') {
        const { requestId, phases } = event.data;
        requestPhasesData[requestId] = phases;
        DataService.saveRequestPhases(requestId, phases);

        // Update the request's phase status in the main list
        const request = requestsData.find(r => r.requestId === requestId);
        if (request) {
            // Calculate new phase status based on phases data
            const allPhases = phases.phases || [];
            const completedPhases = allPhases.filter(p => 
                p.milestones.every(m => m.status === 'Completed')
            ).length;
            
            if (completedPhases === allPhases.length && allPhases.length > 0) {
                request.phase = { 
                    type: 'completed', 
                    label: 'Completed',
                    icon: 'task_alt' 
                };
            } else if (completedPhases > 0 || allPhases.some(p => p.milestones.some(m => m.status === 'Completed'))) {
                request.phase = { 
                    type: 'in-progress', 
                    label: allPhases[completedPhases]?.title || 'In Progress',
                    icon: 'task_alt',
                    indicators: allPhases.map(p => 
                        p.milestones.every(m => m.status === 'Completed') ? 'completed' : 'pending'
                    )
                };
            }
            
            // Save updated request data
            DataService.updateRequest(requestId, request);
            renderRequests();
        }
    }
    if (event.data.type === 'close-panel') {
        const sidePanel = document.querySelector('.side-panel');
        sidePanel.classList.remove('open');
    }
});

let requestsData = [];

document.addEventListener('DOMContentLoaded', () => {
    requestsData = DataService.getAllRequests();
    if (requestsData.length === 0) {
        // Initialize with default data
        requestsData = [
            {
                requestId: 'REQ000104490',
                physician: 'Drake Ramoray',
                institution: 'Salem General Hospital',
                country: 'US',
                owner: 'Gustavo Franci',
                phase: { type: 'new', label: 'New request', icon: 'fiber_new' },
                comments: null
            }
        ];
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requestsData));
    }
    renderRequests();

    const newRequestBtn = document.getElementById('new-request-btn');
    const newRequestModal = document.getElementById('new-request-modal');
    const newRequestForm = document.getElementById('new-request-form');
    const cancelBtn = newRequestModal.querySelector('.cancel-btn');
    const institutionInput = newRequestModal.querySelector('input[name="institution"]');
    const institutionResults = newRequestModal.querySelector('.institution-results');

    let debounceTimeout;
    institutionInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        const query = e.target.value;
        const searchIndicator = newRequestModal.querySelector('.search-indicator');
        
        if (query.length < 3) {
            institutionResults.style.display = 'none';
            searchIndicator.style.display = 'none';
            return;
        }
        
        searchIndicator.style.display = 'block';
        debounceTimeout = setTimeout(async () => {
            const results = await searchInstitutions(query);
            searchIndicator.style.display = 'none';
            institutionResults.innerHTML = results.map(result => `
                <div class="institution-result-item" data-name="${result.name}">
                    <strong>${result.name}</strong>
                    ${result.type ? `<br><small>${result.type}</small>` : ''}
                    ${result.location ? `<br><small>${result.location}</small>` : ''}
                </div>
            `).join('');
            institutionResults.style.display = results.length ? 'block' : 'none';
        }, 300);
    });

    institutionResults.addEventListener('click', (e) => {
        const item = e.target.closest('.institution-result-item');
        if (item) {
            institutionInput.value = item.dataset.name;
            institutionResults.style.display = 'none';
        }
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.institution-search')) {
            institutionResults.style.display = 'none';
        }
    });

    newRequestBtn.addEventListener('click', () => {
        showNewRequestModal();
    });

    cancelBtn.addEventListener('click', hideNewRequestModal);
    newRequestForm.addEventListener('submit', handleNewRequest);
});

function handleNewRequest(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    createNewRequest(formData);
}

function hideNewRequestModal() {
    const newRequestModal = document.getElementById('new-request-modal');
    newRequestModal.style.display = 'none';
}

function showNewRequestModal() {
    const newRequestModal = document.getElementById('new-request-modal');
    newRequestModal.style.display = 'flex';
}

const API_KEY = '0c48a93d3171fb892f720a8ddb831aa9e948baaa';

// Mock data for development until API access is granted
const MOCK_INSTITUTIONS = [
    {
        name: "Salem General Hospital",
        type: "Hospital",
        location: "Salem, Massachusetts, USA"
    },
    {
        name: "Massachusetts General Hospital",
        type: "Hospital",
        location: "Boston, Massachusetts, USA"
    },
    {
        name: "Medical Center of Boston",
        type: "Medical Center",
        location: "Boston, Massachusetts, USA"
    },
    {
        name: "St. Mary's Medical Clinic",
        type: "Clinic",
        location: "Cambridge, Massachusetts, USA"
    }
];

async function searchInstitutions(query) {
    console.log('Searching for:', query);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Filter mock data based on query
    const lowercaseQuery = query.toLowerCase();
    return MOCK_INSTITUTIONS.filter(institution => 
        institution.name.toLowerCase().includes(lowercaseQuery) ||
        institution.type.toLowerCase().includes(lowercaseQuery) ||
        institution.location.toLowerCase().includes(lowercaseQuery)
    );
}

function createNewRequest(formData) {
    // Create the request using the template
    const newRequest = DataService.createNewRequest({
        requestId: generateRequestId(),
        physician: formData.get('physician'),
        institution: formData.get('institution'),
        country: formData.get('country'),
        owner: formData.get('owner') || 'Unassigned',
        phase: {
            type: 'new',
            label: 'New',
            icon: 'fiber_new'
        },
        comments: null
    });

    // Update local data
    requestsData = DataService.getAllRequests();
    
    // Update the UI
    renderRequests();
    
    // Close the modal
    const modal = document.getElementById('new-request-modal');
    modal.style.display = 'none';
    
    // Clear the form
    event.target.reset();
}

function generateRequestId() {
    // Generate a request ID in the format REQ000XXXXX
    const number = Math.floor(Math.random() * 100000);
    return `REQ000${number.toString().padStart(5, '0')}`;
} 