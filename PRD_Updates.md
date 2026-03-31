# Updated PRD Sections - Podcast OS

## Home Screen - Episode Dashboard

The Episode Dashboard serves as the mission control for managing all podcast episodes and their promotion cycles. The interface uses a split layout with episode cards on the left (420px width) and a dynamic preview panel on the right.

### Left Panel - Episode List
- **Create New Episode button** sits at the top, always accessible
- Episode cards display in a scrollable list with smart sorting: planning and in-progress episodes appear first, completed episodes at the bottom
- Each card shows:
  - Episode title in the format "Episode [number]: [episode name]" (e.g., "Episode 18: Meditating On God's Word") - this matches the Asset Library format for visual consistency
  - Release date (formatted as "Month Day, Year")
  - Status badge (Planning, In Progress, or Complete with appropriate color coding)
  - 7-day promotion tracker (only visible for in-progress episodes or episodes with completed days)
- Selected episodes are highlighted with a blue ring and background tint
- Completed episodes have a subtle green background tint

### Right Panel - Episode Preview
- Displays detailed view of the selected episode
- Shows episode name, release date, and an Edit button
- **Video thumbnail** displays automatically if a YouTube link is provided in the episode's video URL field - the thumbnail appears without borders or outlines for a clean, gallery-like presentation with just rounded corners and subtle shadow
- If no video link exists, shows a placeholder with instructions to add a link
- **7-Day Promotion Progress** section displays when an episode is in progress, showing visual day-by-day completion tracking regardless of whether a video asset is linked
- Edit button opens the Edit Episode modal with pre-filled data

### Create New Episode Modal

The Create New Episode modal initializes a new episode with all essential information captured upfront. The modal emphasizes that episodes should only be created after recording is complete, with a subtle reminder displayed at the top.

**Field Order (by priority):**
1. **Episode Name*** (required) - e.g., "Episode: Guest Name"
2. **Episode Number*** (required) - numeric input only, used for categorization in Asset Library and display consistency across the dashboard
3. **Full Video Link*** (required) - accepts any video platform link (Riverside, YouTube, Google Drive, Dropbox, etc.)
4. **Release Date*** (required) - date picker
5. **Guest Name(s)** (optional) - leave blank for solo episodes

**Key Behaviors:**
- All four required fields must be completed before the "Create Episode" button becomes active
- When an episode is created with a video link, the system automatically creates an asset entry in the Asset Library, linked to that episode number and name
- The newly created episode immediately appears in the Episode Dashboard with the format "Episode [number]: [episode name]" and becomes the selected episode
- Form validates that Episode Number only accepts numeric input
- Integration through AppContext ensures episode data is immediately available across all features

### Integration with Asset Library
When a video link is provided during episode creation, the system automatically:
- Creates a corresponding asset entry in the Asset Library
- Links it to the episode using the episode number and name
- Groups it under "Episode [number]: [episode name]" in the Asset Library
- Makes it accessible for the team to reference and share
- Maintains visual consistency with the Episode Dashboard display format

---

## Asset Library

The Asset Library serves as the centralized hub for organizing and accessing all podcast media links, with automatic integration from the Episode Dashboard. Assets are presented in a clean list format, grouped by episode for easy navigation.

### Core Functionality
- **Automatic Asset Creation**: When episodes are created with video links in the Episode Dashboard, those links automatically appear as assets in the library, properly categorized by episode number and name
- **Manual Asset Addition**: Teams can add additional asset links manually (recordings, thumbnails, documents, folders, etc.) with custom names and type categorization
- **Smart Grouping**: Assets are grouped under episode headers that display as "Episode [number]: [episode name]" (e.g., "Episode 18: Meditating On God's Word") - this format matches the Episode Dashboard for visual consistency
- **Sorting**: Episode groups are sorted by episode number in descending order, with the most recent episodes appearing first

### Asset Details
Each asset includes:
- Custom name (e.g., "TY Bello — Full Recording")
- URL/Link (any platform - Riverside, YouTube, Google Drive, Dropbox, etc.)
- Type categorization (Recording, Video, Image/Thumbnail, Document, Folder, Other)
- Visual icon based on type
- Quick actions: Copy link, Open in new tab, Edit, Delete
- Date added for reference

### Episode Group Headers
- Display format: "Episode [number]: [episode name]"
- Shows asset count badge for that episode
- Maintains connection between Episode Dashboard and Asset Library through episode number
- Format consistency allows users to easily identify the same episode across both features

### Search and Filter
- Search by asset name or episode
- Filter by specific episode using dropdown
- "All Episodes" view shows complete library

### Integration Notes
The Asset Library is deeply integrated with the Episode Dashboard through the shared AppContext:
- Episode numbers from the Dashboard directly populate the Asset Library groupings
- Video links added during episode creation flow automatically into the library
- Episode names provide context for asset organization
- **Consistent display format** ("Episode [number]: [episode name]") across both features creates a unified experience
- This eliminates duplicate data entry and ensures consistency across features

---

## Visual Consistency & User Experience

A key design principle across the Episode Dashboard and Asset Library is the consistent display format for episodes:

**"Episode [number]: [episode name]"**

This format appears in:
- Episode cards in the left panel of the Episode Dashboard
- Episode group headers in the Asset Library
- Asset entries linked to episodes

**Benefits:**
- Users can immediately recognize the same episode across different features
- Episode numbers provide quick reference and sorting capability
- Episode names provide context about content/guest
- Creates a cohesive, professional interface
- Reduces cognitive load when navigating between features

**Example Flow:**
1. User creates "Episode 18: Meditating On God's Word" in Episode Dashboard
2. Episode card displays: "Episode 18: Meditating On God's Word"
3. Asset Library automatically creates entry under header: "Episode 18: Meditating On God's Word"
4. User can easily match episodes between features at a glance

---

## Data Integration - AppContext

The application uses a shared AppContext that manages state across all features, enabling seamless connections between the Episode Dashboard and Asset Library:

**Episode to Asset Flow:**
1. User creates episode with Episode Name, Episode Number, and Video Link in the Episode Dashboard
2. Episode immediately displays as "Episode [number]: [episode name]" in the dashboard
3. AppContext automatically generates an asset entry with:
   - Episode number for grouping
   - Episode name for display
   - Video URL as the asset link
   - Appropriate type categorization
4. Asset immediately appears in Asset Library under "Episode [number]: [episode name]" header
5. Consistent formatting ensures visual continuity

**Benefits:**
- Single source of truth for episode data
- No duplicate data entry
- Real-time updates across features
- Episode numbers and names ensure consistent categorization and display
- Teams can add supplementary assets to episodes after initial creation
- Unified user experience through consistent episode display format