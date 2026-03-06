# Blog Tag Filtering - User Guide

## How Tag Filtering Works

### Step 1: View Popular Tags
When you're on a blog details page or the main blog page, you'll see a "Popular Tags" section in the sidebar showing the most commonly used tags across all blogs.

**Example tags you might see:**
- Technology
- Denim
- West Bengal
- Sustainability
- Design

### Step 2: Click a Tag
Click on any tag you're interested in. For example, clicking "Technology" will take you to:
```
/blog?tag=technology
```

### Step 3: View Filtered Results
The blog page will now show:
- **Updated Title**: "Blogs tagged with 'Technology'"
- **Subtitle**: "Showing all articles related to Technology"
- **Filter Badge**: A badge showing the active filter
- **Clear Filter Button**: To return to all blogs
- **Filtered Blog List**: Only blogs containing the "Technology" tag

### Step 4: Clear Filter
To see all blogs again, you can:
- Click the "Clear Filter" button
- Click "View All Blogs" (if no results found)
- Navigate directly to `/blog`

## Technical Details

### URL Structure
```
/blog                    → Shows all blogs
/blog?tag=technology     → Shows only Technology blogs
/blog?tag=denim          → Shows only Denim blogs
```

### Tag Matching
- Case-insensitive: "Technology", "technology", and "TECHNOLOGY" all match
- Exact match: Only blogs with that exact tag are shown
- Multiple tags: If a blog has multiple tags, it will appear in searches for any of those tags

### Example Scenarios

#### Scenario 1: Blog with Single Tag
```json
{
  "title": "Is Modern Fabric Technology Improving Clothing Quality?",
  "tags": ["Technology"]
}
```
- Appears when filtering by: `?tag=technology`

#### Scenario 2: Blog with Multiple Tags
```json
{
  "title": "Why West Bengal Is Ideal for Denim Manufacturing?",
  "tags": ["Denim", "West Bengal"]
}
```
- Appears when filtering by: `?tag=denim` OR `?tag=west bengal`

#### Scenario 3: No Matching Blogs
If you filter by a tag that no blogs have, you'll see:
- Message: "No blog posts found with tag 'xyz'"
- Button: "View All Blogs" to return to the full list

## User Experience Features

✅ **Dynamic Title**: Page title changes based on selected tag
✅ **Visual Feedback**: Badge shows which tag is active
✅ **Easy Navigation**: One-click to clear filter
✅ **Smart Matching**: Case-insensitive tag matching
✅ **Loading States**: Shows loading indicator while fetching
✅ **Empty States**: Helpful messages when no results found
✅ **Popular Tags**: Only shows tags that actually exist in your blogs
✅ **Sorted by Popularity**: Most used tags appear first

## For Developers

### Adding Tags to Blogs
When creating or editing blogs in your CMS, add tags to the `tags` array field:

```json
{
  "title": "Your Blog Title",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
```

### Tag Best Practices
1. Use consistent capitalization (e.g., always "Technology" not "technology")
2. Keep tags concise (1-3 words)
3. Use meaningful, searchable terms
4. Avoid duplicate tags with different spellings
5. Limit to 3-5 tags per blog for best results

### Popular Tags Algorithm
Tags are sorted by:
1. **Frequency**: How many blogs use this tag
2. **Alphabetical**: If frequency is equal, sorted alphabetically

Example:
- "Technology" (used in 5 blogs) → Rank 1
- "Denim" (used in 3 blogs) → Rank 2
- "Design" (used in 3 blogs) → Rank 3
- "Sustainability" (used in 2 blogs) → Rank 4
