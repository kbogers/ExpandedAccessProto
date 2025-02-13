let currentRequestId = null;
let currentPhases = null;

function getRequestId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Listen for messages from the parent window
window.addEventListener('message', (event) => {
    if (event.data.type === 'save-phases') {
        DataService.saveRequestPhases(currentRequestId, event.data.phases);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    currentRequestId = getRequestId();
    if (currentRequestId) {
        document.querySelector('.header-content h2').textContent = currentRequestId;
        
        currentPhases = DataService.getRequestPhases(currentRequestId);
    } else {
        // Initialize with empty phases if no request ID
        currentPhases = DataService.getRequestPhases('new');
    }
    
    renderPhases();
    initializeCategorySelect();

    // Add click handler with console logs for debugging
    const closeButton = document.querySelector('.close-details-btn');
    console.log('Close button:', closeButton); // Debug log
    
    closeButton.addEventListener('click', () => {
        console.log('Close button clicked'); // Debug log
        window.parent.postMessage({ type: 'close-panel' }, '*');
    });

    // Add modal event listeners
    document.querySelector('.modal .close-button').addEventListener('click', () => {
        document.getElementById('milestone-modal').style.display = 'none';
    });

    document.querySelector('.modal .cancel-btn').addEventListener('click', () => {
        document.getElementById('milestone-modal').style.display = 'none';
    });

    document.querySelector('.modal .save-btn').addEventListener('click', () => {
        const modal = document.getElementById('milestone-modal');
        saveMilestone(
            parseInt(modal.dataset.phaseId),
            modal.dataset.milestoneId ? parseInt(modal.dataset.milestoneId) : null
        );
    });
});

// Modify the existing save functions to persist changes
function saveMilestone(phaseId, milestoneId = null) {
    const modal = document.getElementById('milestone-modal');
    const milestone = {
        id: milestoneId || Date.now(),
        title: document.getElementById('milestone-title').value,
        description: document.getElementById('milestone-description').value,
        date: document.getElementById('milestone-due-date').value,
        assignee: document.getElementById('milestone-assignee').value,
        category: document.getElementById('milestone-category').value,
        status: 'Open',
        duration: Array.from(document.querySelectorAll('.reminder-duration')).map(select => select.value)
    };

    // Find the phase and update or add the milestone
    const phase = currentPhases.phases.find(p => p.id === parseInt(phaseId));
    if (phase) {
        if (milestoneId) {
            const index = phase.milestones.findIndex(m => m.id === parseInt(milestoneId));
            if (index !== -1) {
                phase.milestones[index] = { ...phase.milestones[index], ...milestone };
            }
        } else {
            phase.milestones.push(milestone);
        }
    }

    // Update the UI
    renderPhases();

    // After saving, persist the changes
    if (currentRequestId) {
        DataService.saveRequestPhases(currentRequestId, currentPhases);
        
        // Notify parent window of the update
        window.parent.postMessage({
            type: 'phase-update',
            requestId: currentRequestId,
            phases: currentPhases
        }, '*');
    }

    // Hide the modal
    modal.style.display = 'none';
}

function renderPhases() {
    const requestId = getRequestId();
    const phases = DataService.getRequestPhases(requestId);
    
    const phasesContainer = document.getElementById('phases-container');
    phasesContainer.innerHTML = '';

    phases.phases.forEach(phase => {
        const phaseElement = createPhaseElement(phase);
        phasesContainer.appendChild(phaseElement);
    });

    // Initialize sortable for phases
    new Sortable(phasesContainer, {
        animation: 150,
        handle: '.phase-handle',
        onEnd: () => {
            const updatedPhases = {
                phases: Array.from(phasesContainer.children).map(phaseEl => {
                    return phases.phases.find(p => p.id === phaseEl.dataset.phaseId);
                })
            };
            DataService.saveRequestPhases(requestId, updatedPhases);
        }
    });
}

function createPhaseElement(phase) {
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'phase';
    phaseDiv.dataset.phaseId = phase.id;
    
    phaseDiv.innerHTML = `
        <div class="phase-header">
            <span class="material-symbols-rounded phase-handle">drag_indicator</span>
            <h3>${phase.title}</h3>
            <div class="phase-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${phase.progress}%"></div>
                </div>
                <span class="progress-text">${phase.progress}%</span>
            </div>
        </div>
        <div class="phase-content">
            <div class="milestones-list">
                <!-- Milestones will be inserted here -->
            </div>
            <button class="button button-secondary add-milestone-btn">
                <span class="material-symbols-rounded">add</span>
                Add milestone
            </button>
        </div>
    `;

    // Add milestones to the phase
    const milestonesList = phaseDiv.querySelector('.milestones-list');
    phase.milestones.forEach(milestone => {
        milestonesList.appendChild(createMilestoneElement(milestone));
    });

    // Initialize sortable for milestones
    new Sortable(milestonesList, {
        animation: 150,
        handle: '.milestone-handle',
        group: 'milestones',
        onEnd: (evt) => {
            const phaseId = evt.to.closest('.phase').dataset.phaseId;
            updateMilestonesOrder(phaseId);
        }
    });

    // Add milestone button handler
    const addMilestoneBtn = phaseDiv.querySelector('.add-milestone-btn');
    addMilestoneBtn.addEventListener('click', () => {
        showMilestoneModal(phase.id);
    });

    return phaseDiv;
}

function createMilestoneElement(milestone) {
    const milestoneDiv = document.createElement('div');
    milestoneDiv.className = 'milestone';
    milestoneDiv.dataset.milestoneId = milestone.id;
    
    milestoneDiv.innerHTML = `
        <div class="milestone-header">
            <span class="material-symbols-rounded milestone-handle">drag_indicator</span>
            <div class="milestone-title-wrapper">
                <h4 class="milestone-title">${milestone.title}</h4>
                <span class="material-symbols-rounded edit-icon">edit</span>
            </div>
            <div class="select-wrapper status-wrapper">
                <select class="status-select status-${milestone.status.toLowerCase()}" data-milestone-id="${milestone.id}">
                    <option value="Open" ${milestone.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="In Progress" ${milestone.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${milestone.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </div>
        ${milestone.description ? `<p class="milestone-description">${milestone.description}</p>` : ''}
        <div class="milestone-meta">
            ${milestone.date ? `<span class="milestone-date">${milestone.date}</span>` : ''}
            ${milestone.assignee ? `
                <span class="milestone-assignee">
                    <span class="material-symbols-rounded">person</span>
                    ${milestone.assignee}
                </span>
            ` : ''}
        </div>
    `;

    // Add click handler for edit
    const editIcon = milestoneDiv.querySelector('.edit-icon');
    editIcon.addEventListener('click', () => {
        showMilestoneModal(milestone.id);
    });

    // Add change handler for status
    const statusSelect = milestoneDiv.querySelector('.status-select');
    statusSelect.addEventListener('change', (e) => {
        updateMilestoneStatus(milestone.id, e.target.value);
    });

    return milestoneDiv;
}

function updateMilestonesOrder(phaseId) {
    const requestId = getRequestId();
    const phases = DataService.getRequestPhases(requestId);
    const phase = phases.phases.find(p => p.id === phaseId);
    
    if (phase) {
        const milestonesList = document.querySelector(`.phase[data-phase-id="${phaseId}"] .milestones-list`);
        const newOrder = Array.from(milestonesList.children).map(el => {
            return phase.milestones.find(m => m.id === el.dataset.milestoneId);
        });
        
        phase.milestones = newOrder;
        DataService.saveRequestPhases(requestId, phases);
    }
}

function showMilestoneModal(phaseId, milestoneId = null) {
    const modal = document.getElementById('milestone-modal');
    modal.dataset.phaseId = phaseId;
    modal.dataset.milestoneId = milestoneId;

    if (milestoneId) {
        const phase = currentPhases.phases.find(p => p.id === phaseId);
        const milestone = phase.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            document.getElementById('milestone-title').value = milestone.title;
            document.getElementById('milestone-description').value = milestone.description || '';
            document.getElementById('milestone-due-date').value = milestone.date;
            document.getElementById('milestone-assignee').value = milestone.assignee;
            document.getElementById('milestone-category').value = milestone.category || '';
        }
    } else {
        document.getElementById('milestone-title').value = '';
        document.getElementById('milestone-description').value = '';
        document.getElementById('milestone-due-date').value = '';
        document.getElementById('milestone-assignee').value = '';
        document.getElementById('milestone-category').value = '';
    }

    modal.style.display = 'flex';
}

function initializeCategorySelect() {
    const select = document.getElementById('milestone-category');
    const categories = DataService.getCategories();
    select.innerHTML = categories.map(category => 
        `<option value="${category.name}">${category.name}</option>`
    ).join('');

    // Update category dot color when selection changes
    select.addEventListener('change', (e) => {
        const category = categories.find(c => c.name === e.target.value);
        if (category) {
            const dot = select.parentElement.querySelector('.category-dot');
            dot.style.backgroundColor = category.color;
        }
    });
}

// Add a cleanup function for when the panel closes
window.addEventListener('unload', () => {
    if (currentRequestId) {
        DataService.saveRequestPhases(currentRequestId, currentPhases);
    }
}); 