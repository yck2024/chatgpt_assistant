# Google Drive Conflict Resolution Feature Implementation Plan

## Overview
Implement conflict detection and resolution when uploading prompts to Google Drive to prevent data loss from multiple browser instances.

## Problem Statement
Currently, uploading to Google Drive simply overwrites the existing file without checking for changes made by other browser instances. This can lead to:
- Lost prompts added from other devices/browsers
- Data inconsistency across devices
- Poor user experience when prompts "disappear"

## Solution Architecture

### Phase 1: Conflict Detection System
**Goal**: Detect when local and remote data have diverged

#### Components to Modify:
1. **GoogleDriveService** (`google-drive-service.js`)
   - Add `compareVersions()` method
   - Modify `uploadPrompts()` to include conflict detection
   - Add metadata tracking (last modified, version hash)

2. **Background Script** (`background.js`)
   - Update upload handler to use new conflict detection
   - Add conflict resolution workflow

3. **Options Page** (`options.js`)
   - Add conflict resolution UI
   - Handle user decisions on merge/overwrite

### Phase 2: Conflict Resolution Strategies (HYBRID APPROACH)
**Goal**: Auto-merge safe conflicts, user choice for risky ones

#### Conflict Resolution Options:
1. **Automatic Merge** (Safe conflicts)
   - Different prompt keys: Merge automatically
   - No overlapping changes

2. **User Decision Required** (Conflicting changes)
   - Same prompt key with different content
   - Show side-by-side diff viewer
   - User options: Keep Local, Keep Remote, Merge Both (rename with suffix)

3. **Keep Existing JSON Structure**
   - No metadata changes to maintain export/import compatibility
   - Conflict detection based on content comparison only

## Technical Implementation Details

### 1. Data Structure Changes

#### Enhanced Storage Format:
```javascript
{
  "version": "2.0",
  "exportDate": "2025-01-08T10:30:00.000Z",
  "lastModified": "2025-01-08T10:30:00.000Z",
  "deviceId": "browser_instance_uuid",
  "checksum": "sha256_hash_of_prompts",
  "prompts": {
    "key1": {
      "content": "prompt content",
      "lastModified": "2025-01-08T10:25:00.000Z",
      "createdBy": "device_id"
    }
  }
}
```

### 2. Conflict Detection Algorithm

```javascript
class ConflictDetector {
  detectConflicts(localData, remoteData) {
    const conflicts = {
      added: [],      // New prompts in remote
      modified: [],   // Same key, different content
      deleted: [],    // Exists locally but not in remote
      safe: []        // Can be merged automatically
    };
    
    // Implementation details...
    return conflicts;
  }
}
```

### 3. New Methods to Implement

#### GoogleDriveService Updates:
- `downloadAndCompare()` - Download and detect conflicts
- `createBackup()` - Backup current state before merge
- `mergePrompts()` - Intelligent merging logic
- `generateChecksum()` - Create data integrity hash

#### UI Components:
- Conflict resolution modal
- Diff viewer for conflicting prompts
- Merge preview interface

## Implementation Workflow

### Step 1: Enhanced Upload Process
```javascript
async function handleGoogleDriveUploadWithConflictDetection(prompts) {
  try {
    // 1. Download latest from Drive
    const remoteData = await googleDriveService.downloadPrompts();
    
    // 2. Compare with local data
    const conflicts = detectConflicts(prompts, remoteData);
    
    // 3. Handle conflicts based on type
    if (conflicts.requiresUserDecision) {
      return await showConflictResolutionUI(conflicts);
    } else if (conflicts.canAutoMerge) {
      const merged = autoMerge(prompts, remoteData, conflicts);
      return await googleDriveService.uploadPrompts(merged);
    } else {
      // No conflicts, proceed normally
      return await googleDriveService.uploadPrompts(prompts);
    }
  } catch (error) {
    // Handle errors appropriately
  }
}
```

### Step 2: Conflict Resolution UI
- Modal dialog with conflict details
- Side-by-side diff view
- Options: Keep Local, Keep Remote, Merge Both
- Preview of final merged result

### Step 3: Auto-merge Logic
- Combine non-conflicting changes automatically
- Preserve all unique prompt keys
- Use timestamps for same-key conflicts
- Generate new checksum for merged data

## User Experience Flow

### Scenario 1: No Conflicts
```
User clicks "Upload to Drive" 
→ Download latest version
→ No conflicts detected
→ Upload proceeds normally
→ Success message shown
```

### Scenario 2: Auto-mergeable Conflicts
```
User clicks "Upload to Drive"
→ Download latest version  
→ Safe conflicts detected (different keys)
→ Auto-merge performed
→ Upload merged version
→ Show "Merged X new prompts from Drive"
```

### Scenario 3: User Decision Required
```
User clicks "Upload to Drive"
→ Download latest version
→ Conflicting changes detected
→ Show conflict resolution modal
→ User reviews differences
→ User chooses resolution strategy
→ Apply chosen resolution
→ Upload final version
```

## Files to Modify

### 1. `google-drive-service.js`
- Add conflict detection methods
- Enhance upload/download with metadata
- Add backup functionality

### 2. `background.js`  
- Update upload handler logic
- Add conflict resolution workflow

### 3. `options.js` & `options.html`
- Add conflict resolution UI
- Implement diff viewer
- Handle user conflict resolution choices

### 4. New file: `conflict-resolver.js`
- Dedicated conflict detection logic
- Merge algorithms
- Data comparison utilities

## Testing Strategy

### Test Cases:
1. **No conflicts**: Upload works normally
2. **Safe merge**: Different prompt keys auto-merge
3. **Content conflicts**: Same key, different content
4. **Deletion conflicts**: Deleted locally, exists remotely  
5. **Addition conflicts**: New prompts on both sides
6. **Network failures**: Graceful error handling

### Testing Scenarios:
- Two browser instances with different prompt changes
- Rapid sequential uploads from different devices
- Network interruptions during conflict resolution
- Large prompt collections with many conflicts

## Success Criteria
- ✅ No data loss during multi-device sync
- ✅ Clear conflict resolution interface
- ✅ Automatic merging of non-conflicting changes
- ✅ User maintains control over conflicting changes
- ✅ Backup system prevents accidental overwrites
- ✅ Performance remains acceptable with large datasets

## Implementation Timeline
- **Day 1**: Implement conflict detection in GoogleDriveService
- **Day 2**: Create conflict resolution UI components  
- **Day 3**: Integrate conflict workflow into upload process
- **Day 4**: Testing and edge case handling
- **Day 5**: User experience refinement and documentation

## Implementation Status

### ✅ Completed Features
1. **Conflict Detection Logic** - Added to GoogleDriveService
   - `detectConflicts()` method compares local vs remote prompts
   - Identifies modified prompts (same key, different content)
   - Detects new prompts added remotely
   - Auto-merge logic for safe conflicts

2. **Enhanced Upload Process** - Modified background script
   - `handleGoogleDriveUpload()` now checks for conflicts first
   - `handleGoogleDriveForceUpload()` for post-resolution uploads
   - Proper response handling for UI

3. **Conflict Resolution UI** - Added to options.html/js
   - Modal dialog with side-by-side diff viewer
   - Three resolution options: Keep Local, Keep Remote, Merge Both
   - Visual feedback and user-friendly interface
   - Responsive design for mobile devices

4. **User Choice Implementation** - Hybrid approach
   - Auto-merge when no conflicts (different prompt keys)
   - User decision for conflicting content (same key, different content)
   - "Merge Both" option renames conflicting prompts with suffix

### 🧪 Ready for Testing
The implementation is complete and ready for testing. All core functionality has been implemented:

- Conflict detection before upload
- User-friendly conflict resolution interface  
- Three resolution strategies (Local, Remote, Both)
- Auto-merge for safe conflicts
- Proper error handling and user feedback

---

*Plan created: 2025-01-08*  
*Status: Implementation Complete - Ready for Testing*  
*Priority: High (Data Integrity Critical)*