// Open the options page in a new tab when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    chrome.storage.local.get(['downloadRules'], (result) => {
        const rules = result.downloadRules || [];
        
        let matchFound = false;
        
        // Deep inspection fields: 'tabUrl', 'referrer', and 'url'
        const tabUrl = item.tabUrl ? item.tabUrl.toLowerCase() : '';
        const referrer = item.referrer ? item.referrer.toLowerCase() : '';
        const itemUrl = item.url ? item.url.toLowerCase() : '';
        const filename = item.filename ? item.filename.toLowerCase() : '';

        for (const rule of rules) {
            // Support old rules which used rule.source
            const ruleType = rule.type || 'url';
            const ruleValue = (rule.value || rule.source || '').toLowerCase().trim();
            if (!ruleValue) continue;

            let isMatch = false;

            if (ruleType === 'url') {
                // Determine if URL contains any of the keywords
                const keywords = ruleValue.split(',').map(k => k.trim()).filter(k => k.length > 0);
                for (const keyword of keywords) {
                    if (
                        tabUrl.includes(keyword) ||
                        referrer.includes(keyword) ||
                        itemUrl.includes(keyword)
                    ) {
                        isMatch = true;
                        break;
                    }
                }
            } else if (ruleType === 'filetype') {
                // ruleValue is a comma-separated list of extensions e.g. "pdf, doc, docx"
                const extensions = ruleValue.split(',').map(e => e.trim().replace(/^\./, ''));
                
                // Extract extension from filename
                const extMatch = filename.match(/\.([^\.]+)$/);
                if (extMatch) {
                    const ext = extMatch[1];
                    if (extensions.includes(ext)) {
                        isMatch = true;
                    }
                }
            }

            if (isMatch) {
                // Ensure folder names don't have leading/trailing slashes or drive letters
                let folderName = rule.destination.trim();
                folderName = folderName.replace(/^([a-zA-Z]:[\\\/]?)/, '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
                
                // Chrome expects relative paths separated by forward slashes
                const newFilename = folderName ? `${folderName}/${item.filename}` : item.filename;

                suggest({
                    filename: newFilename,
                    conflictAction: 'uniquify'
                });
                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            // Proceed without changing the filename if no rules match
            suggest();
        }
    });

    // Return true to indicate we will call suggest() asynchronously after retrieving rules from storage
    return true;
});
