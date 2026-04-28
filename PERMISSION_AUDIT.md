# Permission Audit - Manifest V3 Compliance

## ✅ Current Permissions (v1.0.3)

### 1. **`sidePanel`** ✅ REQUIRED
- **Used in**: service-worker.js
- **Purpose**: Open and manage the side panel UI
- **Lines**: 7, 8, 12-17, 22-29, 37-42
- **Justification**: Core functionality - extension is a side panel tool

### 2. **`storage`** ✅ REQUIRED
- **Used in**: tools.js, notes.js, settings.js
- **Purpose**: Save user data (bookmarks, responses, notes, settings)
- **API Calls**: 
  - `chrome.storage.local.get()` - Read saved data
  - `chrome.storage.local.set()` - Save user data
- **Justification**: Essential for persisting user preferences and data

### 3. **`scripting`** ✅ REQUIRED
- **Used in**: service-worker.js line 96
- **Purpose**: Dynamically inject content script for text insertion
- **API Call**: `chrome.scripting.executeScript()`
- **Justification**: Needed to insert text into active tab when content script not already present

### 4. **`webNavigation`** ✅ REQUIRED
- **Used in**: service-worker.js line 70
- **Purpose**: Get all frames in a tab for multi-frame text insertion
- **API Call**: `chrome.webNavigation.getAllFrames()`
- **Justification**: Ensures text insertion works in iframes and complex pages

## 🌐 Host Permissions

### **`*://*.wordpress.com/*` and `*://wordpress.com/*`** ✅ REQUIRED
- **Purpose**: Access WordPress.com domains for text insertion
- **Justification**: Extension is specifically for WordPress.com Forum Volunteers
- **Scope**: Only wordpress.com and its subdomains (forums.wordpress.com, etc.)
- **Benefit**: Much more specific than `<all_urls>` - only accesses relevant sites

## ❌ Removed Permissions

### 1. **`tabs`** ❌ REMOVED (v1.0.3)
- **Reason**: Not needed for `chrome.tabs.create()` or `chrome.tabs.query()` in MV3
- **Violation**: Purple Potassium

### 2. **`<all_urls>` host permission** ❌ REMOVED (v1.0.3)
- **Reason**: Too broad - replaced with WordPress.com-specific host permissions
- **Benefit**: More privacy-friendly, only accesses WordPress.com domains
- **How it works now**: Content script injected dynamically only when needed on WordPress.com

### 3. **Declarative `content_scripts`** ❌ REMOVED (v1.0.3)
- **Reason**: Not needed - using dynamic injection via `chrome.scripting.executeScript()`
- **Benefit**: Reduces permission footprint, more MV3 compliant

## 🔒 Privacy & Security Improvements

1. **WordPress.com-only access** - Only accesses wordpress.com domains, not all websites
2. **Dynamic injection** - Content script only loaded when needed
3. **Minimal permissions** - Only what's absolutely necessary
4. **No sensitive data access** - Extension doesn't read tab URLs or content
5. **Specific scope** - Extension clearly limited to its intended use case

## ✅ Manifest V3 Compliance Checklist

- [x] Uses `manifest_version: 3`
- [x] Uses `service_worker` instead of background page
- [x] Uses `action` instead of `browser_action`
- [x] No `tabs` permission for basic tab operations
- [x] Uses specific host permissions (wordpress.com only) instead of `<all_urls>`
- [x] Dynamic content script injection
- [x] No remote code execution
- [x] No eval() or inline scripts
- [x] All permissions justified and necessary
- [x] Minimal permission scope for intended use case

## 📝 How Text Insertion Works Now

1. User clicks "Insert" button in side panel (while on wordpress.com)
2. Side panel sends message to service worker
3. Service worker tries to send message to content script in active tab
4. If content script not present, dynamically injects it via `chrome.scripting.executeScript()`
5. Content script inserts text at cursor position
6. Host permissions only grant access to wordpress.com domains

## 🎯 Result

**All permissions are necessary and justified.**
**No excessive permissions.**
**WordPress.com-specific scope - perfect for the use case.**
**Fully Manifest V3 compliant.**
**Ready for Chrome Web Store approval.**
