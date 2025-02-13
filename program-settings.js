document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.querySelector('.close-settings-btn');
    closeButton.addEventListener('click', () => {
        window.location.href = 'requests.html';
    });

    initializeWorkflowTemplate();
});

function initializeWorkflowTemplate() {
    const phasesList = document.querySelector('.phases-list');
    const addPhaseBtn = document.querySelector('.add-phase-btn');

    const template = loadWorkflowTemplate();
    renderTemplate(template);

    new Sortable(phasesList, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: saveCurrentTemplate
    });

    addPhaseBtn.addEventListener('click', () => {
        const newPhase = {
            id: generateId(),
            title: 'New Phase',
            milestones: []
        };
        
        const phaseElement = createPhaseElement(newPhase);
        phasesList.appendChild(phaseElement);
        saveCurrentTemplate();
    });
}

function createPhaseElement(phase) {
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'phase-container';
    phaseDiv.dataset.phaseId = phase.id;
    
    phaseDiv.innerHTML = `
        <div class="phase-header">
            <span class="material-symbols-rounded drag-handle">drag_indicator</span>
            <input type="text" value="${phase.title}" placeholder="Phase name">
            <button class="delete-btn" aria-label="Delete phase">
                <span class="material-symbols-rounded">delete</span>
            </button>
        </div>
        <div class="milestones-list"></div>
        <button class="button button-secondary add-milestone-btn">
            <span class="material-symbols-rounded">add</span>
            Add milestone
        </button>
    `;

    const milestonesList = phaseDiv.querySelector('.milestones-list');
    phase.milestones.forEach(milestone => {
        milestonesList.appendChild(createMilestoneElement(milestone));
    });

    new Sortable(milestonesList, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: saveCurrentTemplate
    });

    const titleInput = phaseDiv.querySelector('input');
    titleInput.addEventListener('change', saveCurrentTemplate);

    const deleteBtn = phaseDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this phase?')) {
            phaseDiv.remove();
            saveCurrentTemplate();
        }
    });

    const addMilestoneBtn = phaseDiv.querySelector('.add-milestone-btn');
    addMilestoneBtn.addEventListener('click', () => {
        const newMilestone = {
            id: generateId(),
            title: 'New Milestone'
        };
        milestonesList.appendChild(createMilestoneElement(newMilestone));
        saveCurrentTemplate();
    });

    return phaseDiv;
}

function createMilestoneElement(milestone) {
    const milestoneDiv = document.createElement('div');
    milestoneDiv.className = 'milestone-item';
    milestoneDiv.dataset.milestoneId = milestone.id;
    
    milestoneDiv.innerHTML = `
        <span class="material-symbols-rounded drag-handle">drag_indicator</span>
        <input type="text" value="${milestone.title}" placeholder="Milestone name">
        <button class="delete-btn" aria-label="Delete milestone">
            <span class="material-symbols-rounded">delete</span>
        </button>
    `;

    const titleInput = milestoneDiv.querySelector('input');
    titleInput.addEventListener('change', saveCurrentTemplate);

    const deleteBtn = milestoneDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        milestoneDiv.remove();
        saveCurrentTemplate();
    });

    return milestoneDiv;
}

function loadWorkflowTemplate() {
    const saved = localStorage.getItem('workflowTemplate');
    if (saved) {
        return JSON.parse(saved);
    }
    
    return {
        phases: [
            {
                id: generateId(),
                title: 'Phase 1',
                milestones: [
                    { id: generateId(), title: 'Milestone 1' },
                    { id: generateId(), title: 'Milestone 2' }
                ]
            }
        ]
    };
}

function renderTemplate(template) {
    const phasesList = document.querySelector('.phases-list');
    phasesList.innerHTML = '';
    
    template.phases.forEach(phase => {
        phasesList.appendChild(createPhaseElement(phase));
    });
}

function saveCurrentTemplate() {
    const template = {
        phases: Array.from(document.querySelectorAll('.phase-container')).map(phaseEl => ({
            id: phaseEl.dataset.phaseId,
            title: phaseEl.querySelector('.phase-header input').value,
            milestones: Array.from(phaseEl.querySelectorAll('.milestone-item')).map(milestoneEl => ({
                id: milestoneEl.dataset.milestoneId,
                title: milestoneEl.querySelector('input').value
            }))
        }))
    };
    
    localStorage.setItem('workflowTemplate', JSON.stringify(template));
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
} 