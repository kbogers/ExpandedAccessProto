const mockData = {
    phases: [
        {
            id: 1,
            title: 'Phase 1',
            progress: 25,
            milestones: [
                {
                    id: 1,
                    title: 'Milestone 1',
                    status: 'Completed',
                    date: '12 Jan 2025',
                    assignee: 'Chris Harper'
                },
                {
                    id: 2,
                    title: 'Milestone 2',
                    status: 'Open',
                    date: '12 Jan 2025',
                    assignee: 'Chris Harper',
                    duration: ['1 week', '2 days']
                },
                {
                    id: 3,
                    title: 'Milestone 3',
                    status: 'Open',
                    date: '12 Jan 2025',
                    assignee: 'Chris Harper',
                    duration: ['1 week', '2 days'],
                    comment: 'This is a comment related to this milestone'
                }
            ]
        },
        {
            id: 2,
            title: 'Phase 2',
            progress: 25,
            milestones: [
                {
                    id: 1,
                    title: 'Milestone 1',
                    status: 'Completed',
                    date: '12 Jan 2025',
                    assignee: 'Chris Harper'
                },
                {
                    id: 2,
                    title: 'Milestone 2',
                    status: 'Open',
                    date: '12 Jan 2025',
                    assignee: 'Chris Harper',
                    duration: ['1 week', '2 days']
                },
                {
                    id: 3,
                    title: 'Re-order 2',
                    status: 'Open',
                    date: '12 Jan 2025',
                    assignee: 'Chris Harper',
                    duration: ['1 week', '2 days'],
                    comment: '8 vials of product. Expected to last 3 months.'
                }
            ]
        }
    ]
};

function makeEditable(element, value, onSave) {
    const input = document.createElement('input');
    input.value = value;
    input.style.width = '100%';
    input.style.fontSize = element.style.fontSize || 'inherit';
    input.style.fontWeight = element.style.fontWeight || 'inherit';
    input.style.padding = '2px 5px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';

    const saveOnBlur = () => {
        const newValue = input.value.trim();
        if (newValue && newValue !== value) {
            onSave(newValue);
        }
        element.innerHTML = newValue || value;
        input.removeEventListener('blur', saveOnBlur);
        input.removeEventListener('keydown', saveOnEnter);
    };

    const saveOnEnter = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
        if (e.key === 'Escape') {
            input.value = value;
            input.blur();
        }
    };

    input.addEventListener('blur', saveOnBlur);
    input.addEventListener('keydown', saveOnEnter);

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();
}

function togglePhaseCollapse(phaseElement) {
    const header = phaseElement.querySelector('.phase-header');
    const content = phaseElement.querySelector('.phase-content');
    
    if (content.classList.contains('collapsed')) {
        // Expanding
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        // Collapsing
        content.classList.add('collapsed');
        header.classList.add('collapsed');
        content.style.maxHeight = '0';
    }
}

function getDurationOptions(selectedValue = '') {
    const durations = [
        { value: '10-min', label: '10 minutes' },
        { value: '30-min', label: '30 minutes' },
        { value: '1-hour', label: '1 hour' },
        { value: '2-hours', label: '2 hours' },
        { value: '4-hours', label: '4 hours' },
        { value: '1-day', label: '1 day' },
        { value: '2-days', label: '2 days' },
        { value: '3-days', label: '3 days' },
        { value: '1-week', label: '1 week' }
    ];

    return durations.map(duration => 
        `<option value="${duration.value}" ${selectedValue === duration.label ? 'selected' : ''}>
            ${duration.label}
        </option>`
    ).join('');
}

function populateMilestoneModal(milestone) {
    const modal = document.getElementById('milestone-modal');
    modal.querySelector('#milestone-title').value = milestone.title;
    modal.querySelector('#milestone-description').value = milestone.comment || '';
    
    // Convert date from "12 Jan 2025" to "2025-01-12" format for input
    if (milestone.date) {
        const date = new Date(milestone.date);
        const formattedDate = date.toISOString().split('T')[0];
        modal.querySelector('#milestone-due-date').value = formattedDate;
    }
    
    modal.querySelector('#milestone-assignee').value = 'chris'; // Assuming this is the value for Chris Harper
    
    // Reset and populate reminders
    const remindersContainer = modal.querySelector('#reminders-container');
    remindersContainer.innerHTML = milestone.duration ? 
        milestone.duration.map(duration => `
            <div class="reminder-row">
                <div class="select-wrapper">
                    <select class="reminder-duration">
                        ${getDurationOptions(duration)}
                    </select>
                </div>
                <button class="delete-reminder">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        `).join('') 
        : `<div class="reminder-row">
            <div class="select-wrapper">
                <select class="reminder-duration">
                    ${getDurationOptions()}
                </select>
            </div>
            <button class="delete-reminder">
                <span class="material-symbols-rounded">delete</span>
            </button>
        </div>`;

    // Set category if it exists
    if (milestone.category) {
        const categorySelect = modal.querySelector('#milestone-category');
        const categoryOption = Array.from(categorySelect.options)
            .find(option => option.value === milestone.category.toLowerCase());
        
        if (categoryOption) {
            categoryOption.selected = true;
        }
    }
}

function showMilestoneModal(phaseId, milestoneId = null) {
    const modal = document.getElementById('milestone-modal');
    modal.style.display = 'flex';
    modal.dataset.phaseId = phaseId;
    modal.dataset.milestoneId = milestoneId;

    if (milestoneId) {
        const phase = mockData.phases.find(p => p.id === parseInt(phaseId));
        const milestone = phase.milestones.find(m => m.id === parseInt(milestoneId));
        populateMilestoneModal(milestone);
    } else {
        hideMilestoneModal(); // This will reset the form
        modal.style.display = 'flex'; // Show the modal again after reset
    }
}

function hideMilestoneModal() {
    const modal = document.getElementById('milestone-modal');
    modal.style.display = 'none';
    // Reset form
    modal.querySelector('#milestone-title').value = '';
    modal.querySelector('#milestone-description').value = '';
    modal.querySelector('#milestone-due-date').value = '';
    // Reset reminders to default
    const remindersContainer = modal.querySelector('#reminders-container');
    remindersContainer.innerHTML = `
        <div class="reminder-row">
            <div class="select-wrapper">
                <select class="reminder-duration">
                    <option value="1-week">1 week</option>
                    <option value="2-days">2 days</option>
                </select>
            </div>
            <button class="delete-reminder">🗑</button>
        </div>
    `;
}

function addReminder() {
    const reminderRow = document.createElement('div');
    reminderRow.className = 'reminder-row';
    reminderRow.innerHTML = `
        <div class="select-wrapper">
            <select class="reminder-duration">
                ${getDurationOptions()}
            </select>
        </div>
        <button class="delete-reminder">
            <span class="material-symbols-rounded">delete</span>
        </button>
    `;
    document.getElementById('reminders-container').appendChild(reminderRow);
}

function saveMilestone(phaseId, milestoneId = null) {
    const title = document.getElementById('milestone-title').value;
    const description = document.getElementById('milestone-description').value;
    const dueDate = document.getElementById('milestone-due-date').value;
    const assignee = document.getElementById('milestone-assignee').value;
    const category = document.getElementById('milestone-category').selectedOptions[0].text;
    
    const reminders = Array.from(document.querySelectorAll('.reminder-duration'))
        .map(select => {
            const option = select.options[select.selectedIndex];
            return option.textContent.trim();
        });

    const phase = mockData.phases.find(p => p.id === parseInt(phaseId));
    
    if (milestoneId) {
        // Edit existing milestone
        const milestone = phase.milestones.find(m => m.id === parseInt(milestoneId));
        milestone.title = title;
        milestone.date = new Date(dueDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        milestone.assignee = 'Chris Harper';
        milestone.duration = reminders;
        milestone.comment = description;
        milestone.category = category;
    } else {
        // Create new milestone
        const newMilestone = {
            id: Math.max(...phase.milestones.map(m => m.id)) + 1,
            title,
            status: 'Not started',
            date: new Date(dueDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }),
            assignee: 'Chris Harper',
            duration: reminders,
            comment: description,
            category: category,
        };
        phase.milestones.push(newMilestone);
    }

    renderPhases();
    hideMilestoneModal();
}

function updateMilestoneStatus(phaseId, milestoneId, newStatus) {
    const phase = mockData.phases.find(p => p.id === parseInt(phaseId));
    const milestone = phase.milestones.find(m => m.id === parseInt(milestoneId));
    milestone.status = newStatus;
    renderPhases();
}

function calculatePhaseProgress(milestones) {
    const total = milestones.length;
    if (total === 0) return { notStarted: 0, inProgress: 0, completed: 0 };
    
    const stats = milestones.reduce((acc, milestone) => {
        switch(milestone.status) {
            case 'Not started':
                acc.notStarted++;
                break;
            case 'In progress':
                acc.inProgress++;
                break;
            case 'Completed':
                acc.completed++;
                break;
        }
        return acc;
    }, { notStarted: 0, inProgress: 0, completed: 0 });

    return {
        notStarted: (stats.notStarted / total) * 100,
        inProgress: (stats.inProgress / total) * 100,
        completed: (stats.completed / total) * 100
    };
}

function initializeSortable() {
    document.querySelectorAll('.phase-content').forEach(phaseContent => {
        const phaseId = phaseContent.closest('.phase').dataset.phaseId;
        
        new Sortable(phaseContent, {
            group: 'milestones', // This allows dragging between phases
            animation: 150,
            handle: '.milestone-header', // Drag using the header only
            draggable: '.milestone', // Only milestone items can be dragged
            ghostClass: 'milestone-ghost', // Class for the dragging item
            chosenClass: 'milestone-chosen', // Class for the chosen item
            dragClass: 'milestone-drag', // Class for the dragging item
            
            onEnd: function(evt) {
                const fromPhaseId = evt.from.closest('.phase').dataset.phaseId;
                const toPhaseId = evt.to.closest('.phase').dataset.phaseId;
                const milestoneId = evt.item.dataset.milestoneId;
                const newIndex = evt.newIndex;

                // Find the milestone in the original phase
                const fromPhase = mockData.phases.find(p => p.id === parseInt(fromPhaseId));
                const milestone = fromPhase.milestones.find(m => m.id === parseInt(milestoneId));
                
                // Remove from original phase
                fromPhase.milestones = fromPhase.milestones.filter(m => m.id !== parseInt(milestoneId));
                
                // Add to new phase at the correct position
                const toPhase = mockData.phases.find(p => p.id === parseInt(toPhaseId));
                toPhase.milestones.splice(newIndex, 0, milestone);

                // Update the UI to reflect the new order
                renderPhases();
            }
        });
    });
}

function renderMilestone(milestone) {
    return `
        <div class="milestone" data-milestone-id="${milestone.id}">
            <div class="milestone-header">
                <div class="milestone-title-wrapper">
                    <span class="milestone-title editable-milestone-title">${milestone.title}</span>
                    <span class="edit-icon material-symbols-rounded">edit</span>
                </div>
                <span class="milestone-status ${milestone.status.toLowerCase()}">${milestone.status}</span>
            </div>
            <div class="milestone-details">
                <div class="detail-item">
                    <span class="material-symbols-rounded">calendar_month</span>
                    ${milestone.date}
                </div>
                <div class="detail-item">
                    <span class="material-symbols-rounded">person</span>
                    ${milestone.assignee}
                </div>
            </div>
        </div>
    `;
}

function renderPhases() {
    const container = document.getElementById('phases-container');
    container.innerHTML = mockData.phases.map(phase => {
        const progress = calculatePhaseProgress(phase.milestones);
        const tooltip = `Completed: ${Math.round(progress.completed)}% | In Progress: ${Math.round(progress.inProgress)}% | Not Started: ${Math.round(progress.notStarted)}%`;
        
        return `
            <div class="phase" data-phase-id="${phase.id}">
                <div class="phase-header">
                    <span class="material-symbols-rounded">expand_more</span>
                    <span class="phase-title editable-phase-title">${phase.title}</span>
                    <div class="phase-progress">
                        <div class="progress-bar" data-tooltip="${tooltip}">
                            <div class="progress-fill" style="width: ${progress.completed}%"></div>
                        </div>
                        <span class="progress-text">${Math.round(progress.completed)}%</span>
                    </div>
                </div>
                <div class="phase-content">
                    ${phase.milestones.map(milestone => renderMilestone(milestone)).join('')}
                    <button class="add-milestone-btn" data-phase-id="${phase.id}">+ Add milestone</button>
                </div>
            </div>
        `;
    }).join('');

    // Set up click handlers for edit icons
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const milestoneElement = e.target.closest('.milestone');
            const phaseElement = milestoneElement.closest('.phase');
            const phaseId = parseInt(phaseElement.dataset.phaseId);
            const milestoneId = parseInt(milestoneElement.dataset.milestoneId);
            showMilestoneModal(phaseId, milestoneId);
        });
    });

    // Remove the click handler from milestone elements
    // Only keep necessary event listeners (like phase collapse)
    document.querySelectorAll('.phase-header').forEach(header => {
        header.addEventListener('click', () => {
            const phase = header.closest('.phase');
            phase.classList.toggle('collapsed');
        });
    });

    document.querySelectorAll('.editable-phase-title').forEach(element => {
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation(); // Prevent collapse trigger
            const phaseElement = e.target.closest('.phase');
            const phaseId = parseInt(phaseElement.dataset.phaseId);
            const phase = mockData.phases.find(p => p.id === phaseId);
            
            makeEditable(e.target, phase.title, (newTitle) => {
                phase.title = newTitle;
                // Here you would typically also update the backend
            });
        });
    });

    document.querySelectorAll('.editable-milestone-title').forEach(element => {
        element.addEventListener('dblclick', (e) => {
            const milestoneElement = e.target.closest('.milestone');
            const phaseElement = e.target.closest('.phase');
            const phaseId = parseInt(phaseElement.dataset.phaseId);
            const milestoneId = parseInt(milestoneElement.dataset.milestoneId);
            
            const phase = mockData.phases.find(p => p.id === phaseId);
            const milestone = phase.milestones.find(m => m.id === milestoneId);
            
            makeEditable(e.target, milestone.title, (newTitle) => {
                milestone.title = newTitle;
                // Here you would typically also update the backend
            });
        });
    });

    // Set initial max-height for all phase contents
    document.querySelectorAll('.phase-content').forEach(content => {
        content.style.maxHeight = content.scrollHeight + 'px';
    });

    document.querySelectorAll('.add-milestone-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const phaseId = e.target.closest('.phase').dataset.phaseId;
            showMilestoneModal(phaseId);
        });
    });

    initializeSortable();

    // Add click handler for milestone editing
    document.querySelectorAll('.milestone').forEach(milestone => {
        milestone.addEventListener('click', (e) => {
            // Don't trigger if clicking on status select or drag handle
            if (e.target.closest('.status-wrapper') || 
                e.target.closest('.drag-handle')) {
                return;
            }
            const phaseId = milestone.closest('.phase').dataset.phaseId;
            const milestoneId = milestone.dataset.milestoneId;
            showMilestoneModal(phaseId, milestoneId);
        });
    });
}

// Add this function to manage categories
function initializeCategorySelect() {
    const categorySelect = document.getElementById('milestone-category');
    const defaultCategories = ['Re-order', 'Meeting', 'Review', 'Delivery'];
    
    // Get stored categories or use defaults
    const categories = JSON.parse(localStorage.getItem('milestone-categories')) || defaultCategories;
    
    function updateCategoryOptions() {
        categorySelect.innerHTML = `
            ${categories.map(category => {
                const color = getCategoryColor(category);
                return `
                    <option value="${category.toLowerCase()}" data-color="${color.dot}">
                        ${category}
                    </option>
                `;
            }).join('')}
            <option value="add-new">+ Add new category</option>
        `;
    }
    
    updateCategoryOptions();
    
    categorySelect.addEventListener('change', function(e) {
        if (this.value === 'add-new') {
            const newCategory = prompt('Enter new category name:');
            if (newCategory && newCategory.trim()) {
                // Add new category to array and localStorage
                categories.push(newCategory.trim());
                localStorage.setItem('milestone-categories', JSON.stringify(categories));
                
                // Update dropdown and select new category
                updateCategoryOptions();
                this.value = newCategory.toLowerCase();
            } else {
                // If cancelled or empty, revert to first option
                this.selectedIndex = 0;
            }
        } else {
            // Update the dot color when selection changes
            const dot = this.parentElement.querySelector('.category-dot');
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.dataset.color) {
                dot.style.backgroundColor = selectedOption.dataset.color;
            }
        }
    });

    // Initial color for the first option
    const firstOption = categorySelect.options[0];
    if (firstOption && firstOption.dataset.color) {
        categorySelect.parentElement.querySelector('.category-dot').style.backgroundColor = firstOption.dataset.color;
    }
}

// Add this function to get a deterministic color for a category
function getCategoryColor(category) {
    const colors = [
        { bg: 'var(--green-50)', dot: 'var(--green-600)' },
        { bg: 'var(--blue-50)', dot: 'var(--blue-600)' },
        { bg: 'var(--purple-50)', dot: 'var(--purple-600)' },
        { bg: 'var(--yellow-50)', dot: 'var(--yellow-600)' },
        { bg: 'var(--red-50)', dot: 'var(--red-600)' }
    ];
    
    // Use the category name to deterministically pick a color
    const index = Math.abs(category.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0)) % colors.length;
    
    return colors[index];
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderPhases();
    initializeCategorySelect();

    // Modal event listeners
    document.querySelector('.close-button').addEventListener('click', hideMilestoneModal);
    document.querySelector('.cancel-btn').addEventListener('click', hideMilestoneModal);
    document.querySelector('.save-btn').addEventListener('click', () => {
        const modal = document.getElementById('milestone-modal');
        const phaseId = modal.dataset.phaseId;
        const milestoneId = modal.dataset.milestoneId;
        saveMilestone(phaseId, milestoneId);
    });
    document.querySelector('.add-reminder-btn').addEventListener('click', addReminder);
    
    // Event delegation for dynamic reminder delete buttons
    document.getElementById('reminders-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-reminder')) {
            const reminderRows = document.querySelectorAll('.reminder-row');
            if (reminderRows.length > 1) {
                e.target.closest('.reminder-row').remove();
            }
        }
    });
}); 