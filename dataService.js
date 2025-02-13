const STORAGE_KEYS = {
    REQUESTS: 'milestone_tracker_requests',
    REQUEST_PHASES: 'milestone_tracker_phases',
    CATEGORIES: 'milestone_tracker_categories',
    WORKFLOW_TEMPLATE: 'workflowTemplate',
};

const DEFAULT_PHASES = {
    phases: [{
        id: 1,
        title: 'Phase 1',
        progress: 0,
        milestones: []
    }]
};

const DataService = {
    // Request operations
    getAllRequests() {
        const stored = localStorage.getItem(STORAGE_KEYS.REQUESTS);
        return stored ? JSON.parse(stored) : [];
    },

    saveRequest(request) {
        const requests = this.getAllRequests();
        requests.push(request);
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    },

    updateRequest(requestId, updates) {
        const requests = this.getAllRequests();
        const index = requests.findIndex(r => r.requestId === requestId);
        if (index !== -1) {
            requests[index] = { ...requests[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
        }
    },

    // Phases operations
    getRequestPhases(requestId) {
        if (!requestId || requestId === 'new') {
            return DEFAULT_PHASES;
        }
        const stored = localStorage.getItem(`${STORAGE_KEYS.REQUEST_PHASES}_${requestId}`);
        return stored ? JSON.parse(stored) : DEFAULT_PHASES;
    },

    saveRequestPhases(requestId, phases) {
        localStorage.setItem(
            `${STORAGE_KEYS.REQUEST_PHASES}_${requestId}`, 
            JSON.stringify(phases)
        );
    },

    // Categories operations
    getCategories() {
        const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        return stored ? JSON.parse(stored) : [
            { name: 'Supply', color: 'var(--green-600)' },
            { name: 'Enrollment', color: 'var(--blue-600)' },
            { name: 'Documentation', color: 'var(--purple-600)' }
        ];
    },

    saveCategory(category) {
        const categories = this.getCategories();
        categories.push(category);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    },

    getWorkflowTemplate() {
        const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOW_TEMPLATE);
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Default template if none exists
        return {
            phases: [
                {
                    id: this.generateId(),
                    title: 'Phase 1',
                    milestones: [
                        { id: this.generateId(), title: 'Milestone 1' },
                        { id: this.generateId(), title: 'Milestone 2' }
                    ]
                }
            ]
        };
    },

    createNewRequest(requestData) {
        // Get the workflow template
        const template = this.getWorkflowTemplate();
        
        // Create new request with unique IDs for phases and milestones
        const request = {
            ...requestData,
            createdAt: new Date().toISOString()
        };

        // Save the request
        this.saveRequest(request);

        // Create phases from template
        const phases = {
            phases: template.phases.map(phase => ({
                id: Math.random().toString(36).substr(2, 9),
                title: phase.title,
                progress: 0,
                milestones: phase.milestones.map(milestone => ({
                    id: Math.random().toString(36).substr(2, 9),
                    title: milestone.title,
                    status: 'Open',
                    date: null,
                    assignee: null,
                    description: ''
                }))
            }))
        };

        // Save the phases for this request
        this.saveRequestPhases(request.requestId, phases);

        return request;
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}; 