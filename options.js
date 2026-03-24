document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-rule-form');
    const ruleTypeSelect = document.getElementById('rule-type');
    const ruleValueInput = document.getElementById('rule-value');
    const ruleValueLabel = document.getElementById('rule-value-label');
    const destinationInput = document.getElementById('destination');
    const rulesContainer = document.getElementById('rules-container');
    const defaultsContainer = document.getElementById('defaults-container');
    const saveStatus = document.getElementById('save-status');

    let draggedIndex = null;

    const DEFAULT_RULES = [
        { type: 'filetype', value: 'mp4, mkv, avi, webm, mov', destination: 'Videos' },
        { type: 'filetype', value: 'mp3, wav, flac, aac, ogg', destination: 'Sounds' },
        { type: 'filetype', value: 'pdf, doc, docx, txt, rtf', destination: 'Documents' },
        { type: 'filetype', value: 'ppt, pptx, key', destination: 'Presentations' },
        { type: 'filetype', value: 'jpg, png, gif, jpeg, webp, svg', destination: 'Images' },
        { type: 'filetype', value: 'zip, rar, 7z, tar, gz', destination: 'Compressed' },
        { type: 'filetype', value: 'exe, msi, apk, dmg', destination: 'Executables' },
        { type: 'filetype', value: 'c, cpp, py, js, java, html, css, json, sql, class, md, ts', destination: 'Code' }
    ];

    // Load setup
    loadData();

    ruleTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'url') {
            ruleValueLabel.textContent = 'URLs or Keywords (comma separated)';
            ruleValueInput.placeholder = 'e.g. web.whatsapp.com, github.com';
        } else {
            ruleValueLabel.textContent = 'File Extensions (comma separated)';
            ruleValueInput.placeholder = 'e.g. pdf, docx, txt';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = ruleTypeSelect.value;
        const value = ruleValueInput.value.trim();
        let destination = destinationInput.value.trim();
        
        destination = destination.replace(/^([a-zA-Z]:[\\\/]?)/, '');
        destination = destination.replace(/\\/g, '/');
        destination = destination.replace(/^\/+|\/+$/g, '');
        
        if (value && destination) {
            addRule({ type, value, destination });
            ruleValueInput.value = '';
            destinationInput.value = '';
            showStatus('Rule added successfully!');
        }
    });

    function loadData() {
        chrome.storage.local.get(['downloadRules', 'dismissedDefaults'], (result) => {
            const rules = result.downloadRules || [];
            renderRules(rules);
            renderDefaults(rules, result.dismissedDefaults || []);
        });
    }

    function addRule(newRule) {
        chrome.storage.local.get(['downloadRules'], (result) => {
            const rules = result.downloadRules || [];
            
            const isDuplicate = rules.some(r => {
                const rType = r.type || 'url';
                const rValue = r.value || r.source || '';
                return rType === newRule.type && rValue === newRule.value && r.destination === newRule.destination;
            });
            
            if (!isDuplicate) {
                rules.push(newRule);
                chrome.storage.local.set({ downloadRules: rules }, () => {
                    loadData(); // Re-render both active and defaults
                });
            } else {
                showStatus('Rule already exists!');
            }
        });
    }

    function deleteRule(index) {
        chrome.storage.local.get(['downloadRules'], (result) => {
            const rules = result.downloadRules || [];
            rules.splice(index, 1);
            chrome.storage.local.set({ downloadRules: rules }, () => {
                loadData();
                showStatus('Rule deleted successfully!');
            });
        });
    }

    function hideDefault(idx) {
        chrome.storage.local.get(['dismissedDefaults'], (result) => {
            const dismissed = result.dismissedDefaults || [];
            if (!dismissed.includes(idx)) dismissed.push(idx);
            chrome.storage.local.set({ dismissedDefaults: dismissed }, () => {
                loadData();
            });
        });
    }

    function updateRulesOrder(newRules) {
        chrome.storage.local.set({ downloadRules: newRules }, () => {
            showStatus('Rules reordered successfully!');
        });
    }

    function renderRules(rules) {
        rulesContainer.innerHTML = '';
        
        if (rules.length === 0) {
            rulesContainer.innerHTML = '<div class="empty-state">No routing rules found. Create one above!</div>';
            return;
        }

        rules.forEach((rule, index) => {
            const ruleEl = document.createElement('div');
            ruleEl.className = 'rule-item list-container';
            ruleEl.draggable = true;
            
            const ruleType = rule.type || 'url';
            const ruleValue = rule.value || rule.source || '';
            const badge = ruleType === 'url' ? '<span class="badge badge-url">URL</span>' : '<span class="badge badge-file">File Type</span>';
            
            ruleEl.innerHTML = `
                <div class="drag-handle" title="Drag to reorder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="8" x2="20" y2="8"></line><line x1="4" y1="16" x2="20" y2="16"></line></svg>
                </div>
                <div class="rule-info flex-grow">
                    <span class="rule-source">
                        ${badge}
                        ${escapeHtml(ruleValue)}
                    </span>
                    <span class="rule-dest">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Routes to: /${escapeHtml(rule.destination)}
                    </span>
                </div>
                <button type="button" class="btn-danger" data-index="${index}">Delete</button>
            `;
            
            // Drag and Drop implementation
            ruleEl.addEventListener('dragstart', (e) => {
                draggedIndex = index;
                e.dataTransfer.effectAllowed = 'move';
                // Slight delay to allow the drag image to be generated before styling
                setTimeout(() => ruleEl.classList.add('dragging'), 0);
            });

            ruleEl.addEventListener('dragend', () => {
                ruleEl.classList.remove('dragging');
                draggedIndex = null;
            });

            ruleEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            ruleEl.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedIndex === null || draggedIndex === index) return;
                
                const draggedRule = rules.splice(draggedIndex, 1)[0];
                rules.splice(index, 0, draggedRule);
                
                renderRules(rules); // Optimistic UI update
                updateRulesOrder(rules);
            });

            rulesContainer.appendChild(ruleEl);
        });

        document.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                deleteRule(index);
            });
        });
    }

    function renderDefaults(activeRules, dismissed) {
        defaultsContainer.innerHTML = '';
        let count = 0;

        DEFAULT_RULES.forEach((defRule, index) => {
            const isAdded = activeRules.some(r => r.type === defRule.type && r.value === defRule.value && r.destination === defRule.destination);
            const isDismissed = dismissed.includes(index);
            
            if (!isAdded && !isDismissed) {
                count++;
                const defEl = document.createElement('div');
                defEl.className = 'rule-item list-container';
                defEl.innerHTML = `
                    <div class="rule-info flex-grow">
                        <span class="rule-source">
                            <span class="badge badge-file" style="background-color: transparent; color: var(--text-muted); border: 1px solid var(--border);">Suggestion</span>
                            ${escapeHtml(defRule.value)}
                        </span>
                        <span class="rule-dest">
                             Routes to: /${escapeHtml(defRule.destination)}
                        </span>
                    </div>
                    <div>
                        <button type="button" class="btn-primary" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;" data-add-index="${index}">Add</button>
                        <button type="button" class="btn-dismiss" data-remove-index="${index}" title="Dismiss hint">&#10005;</button>
                    </div>
                `;
                defaultsContainer.appendChild(defEl);
            }
        });

        if (count === 0) {
            defaultsContainer.innerHTML = '<div class="empty-state">All suggestions added or dismissed!</div>';
        }

        defaultsContainer.querySelectorAll('.btn-primary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-add-index'));
                addRule(DEFAULT_RULES[idx]);
            });
        });

        defaultsContainer.querySelectorAll('.btn-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-remove-index'));
                hideDefault(idx);
            });
        });
    }

    function showStatus(message) {
        saveStatus.textContent = message;
        saveStatus.style.opacity = '1';
        setTimeout(() => {
            saveStatus.style.opacity = '0';
        }, 2500);
    }

    function escapeHtml(unsafe) {
        return (unsafe || '')
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
