# Design Documentation

## Database Schema & Entity Design

The assignment provided a base User entity with standard fields (id, firstName, lastName, email, timestamps). From there, I needed to build out the rest of the social media backend.

### Core Entities

**Posts**
- Standard blog-post style table
- References User as author via foreign key
- Content field with 5000 char limit (seemed reasonable for a social platform)
- Timestamps for sorting chronologically

**Likes**
- Junction between Users and Posts
- Decided against just storing a counter on Post because you lose track of who liked what
- Need this granularity for features like "show who liked this" and preventing double-likes

**Follows**  
- Self-referential on Users table
- This one required some thought on naming - went with followerId and followingId
  - followerId = the person clicking "follow"
  - followingId = the person being followed
- Had to be careful with this because it's easy to mix them up when writing queries

**Hashtags**
- Separate table rather than embedding in Post.content
- Stores normalized (lowercase) tag strings
- Unique constraint so we don't duplicate "#javascript" 50 times

**PostHashtag**
- Many-to-many junction table
- Links posts to their hashtags
- Allows efficient querying in both directions (posts by hashtag, hashtags on post)

### Why I Normalized Hashtags

Initially considered just parsing hashtags from post content on-the-fly. But that meant:
- Full text search on every hashtag query (slow)
- Can't get hashtag statistics easily
- Can't optimize hashtag searches with indexes

Separate tables + junction pattern gives us:
- Fast lookups via indexed foreign keys
- Ability to track hashtag usage/trends
- Case-insensitive matching without LOWER() in every query

The tradeoff is complexity - more tables, more joins. But for a feature that's core to the product (hashtag search endpoint is required), it's worth it.

## Indexing Strategy

Query performance was a major consideration given the endpoints we need to support. Here's the approach I took:

### Feed Endpoint (/api/feed)

This is probably the most complex query in the system. Steps:
1. Find all users that current user follows
2. Get posts from those users
3. Sort chronologically (newest first)
4. Paginate the results

The query pattern is essentially:
```
Find posts WHERE authorId IN (user's following list) 
ORDER BY createdAt DESC
```

**Current Indexes:**
- `idx_post_author` on Post.authorId
- `idx_post_created` on Post.createdAt
- `idx_follow_follower` on Follow.followerId

These separate indexes handle the filtering and sorting for the feed query.

### Hashtag Search (/api/posts/hashtag/:tag)

Query path: Hashtag table → PostHashtag junction → Post table

The hashtag string needs to be looked up first, converted to an ID, then we find all posts with that hashtag ID.

Indexes needed:
- `Hashtag.tag` with UNIQUE constraint (automatically indexed)
- `idx_posthashtag_hashtag` on PostHashtag.hashtagId for the join

Design decision: Store hashtags as lowercase strings. This means "#JavaScript", "#javascript", and "#JAVASCRIPT" all normalize to "javascript" before storage. The controller normalizes input with `.toLowerCase()` before querying, so matching is case-insensitive without needing database-level LOWER() calls or special collation.

### Followers Endpoint (/api/users/:id/followers)

Find all Follow records where followingId matches the user.

**Index: `idx_follow_following` on followingId**

This makes finding a user's followers fast. The endpoint also sorts by createdAt DESC (newest followers first), which happens after the filtered results are fetched.

### Activity Feed (/api/users/:id/activity)

This endpoint aggregates data from three different tables:
- Posts created by user
- Likes given by user
- Follow actions by user

Then merges and sorts them chronologically in application memory.

Indexes that help:
- `idx_post_author` on Post.authorId
- `idx_like_post` on Like.postId
- `idx_follow_follower` on Follow.followerId

The queries use these indexes for basic filtering. Date range filtering and final sorting happen after fetching the results.

### Preventing Duplicate Actions

Instead of checking for duplicates in application code (prone to race conditions), I used database-level unique constraints:

- **UNIQUE (userId, postId)** on Like table
- **UNIQUE (followerId, followingId)** on Follow table

Database enforces this atomically. Duplicate insert attempts fail immediately with a constraint violation error.

### Indexes I Deliberately Skipped

- User.firstName, User.lastName - no search-by-name functionality required
- Post.content - would need full-text indexing, SQLite doesn't handle this well
- UpdatedAt columns - not used in WHERE clauses or ORDER BY

Every index has a cost on write operations. Only index what you actually query.

## Data Validation & Integrity

Following the pattern established in the User validation, I implemented Joi schemas for all entities:

**Validation Rules:**
- Email format validation with max 255 chars
- Name fields: 2-255 character range
- Post content: 1-5000 characters (allowing substantial posts but not unlimited)
- Hashtags: alphanumeric + underscore only, max 50 chars per tag

The validation middleware intercepts requests before they reach controllers. Invalid data gets rejected with 400 status and descriptive error messages.

Database-level constraints provide a second layer of defense:
- Foreign key constraints with appropriate CASCADE behaviors
- NOT NULL on required fields  
- UNIQUE constraints where needed (email, hashtag tag, like/follow combinations)

This defense-in-depth approach means bad data can't make it to the database even if validation is bypassed.

## Query Optimization & Performance

### Pagination Implementation

Every list endpoint supports `limit` and `offset` query parameters with sensible defaults (10-20 items).

Rationale: Returning thousands of records in a single response causes issues at every layer - network bandwidth, client memory, rendering performance. Pagination is non-negotiable for production systems.

### N+1 Query Reduction

A common ORM pitfall: fetch posts, then loop and fetch author for each post. That's 1 + N database queries.

TypeORM's `relations` option can help by loading related data with JOIN queries. For example, the followers endpoint uses `relations: ['follower']` to eagerly load user data in the same query, avoiding N+1 on that path.

However, not all endpoints use this pattern - the activity endpoint deliberately makes separate queries to each table then aggregates in memory. This is a tradeoff between query complexity and result flexibility.

### Feed Performance Analysis

Current implementation:
```typescript
1. Query Follow table for user's following list
2. Query Post table WHERE authorId IN (following IDs)
3. ORDER BY createdAt DESC
4. LIMIT/OFFSET for pagination
```

This works well up to a few hundred follows. The IN clause with many IDs becomes expensive with larger following lists.

## Implementation Decisions & Tradeoffs

### Migration-Based Schema Management

The assignment specifically prohibits `synchronize: true` in TypeORM config. This is actually good practice.

Migrations provide:
- Explicit change tracking (reviewable in version control)
- Rollback capability (undo problematic changes)
- Production safety (no accidental schema modifications)

Migration commands:
```bash
npm run migration:generate  # Create migration from entity changes
npm run migration:run       # Apply pending migrations
npm run migration:revert    # Rollback last migration
```

### Activity Endpoint Implementation

The `/api/users/:id/activity` endpoint:
1. Queries Post table for user's posts
2. Queries Like table for user's likes  
3. Queries Follow table for user's follows
4. Merges results in application memory
5. Sorts combined array by timestamp
6. Slices for pagination

This approach works but has limitations - three separate queries, in-memory sorting, and loading all data before pagination.

### Error Handling Approach

Current pattern: try-catch blocks in every controller method with generic 500 responses. Functional but basic.

### Authentication Omission

No authentication or authorization implemented. All endpoints are public. Assignment doesn't require it.

## Testing Strategy

The test.sh script uses bash + curl for API testing. It covers:
- All CRUD operations on each entity
- Special endpoints (feed, hashtag search, followers, activity)
- Pagination functionality
- Error cases (404, validation failures)

## What Worked Well

**Indexing Strategy**: Covered the main query paths with targeted indexes on authorId, createdAt, followerId, and followingId.

**Code Organization**: Clean separation between routes, controllers, validation, and entities. Easy to locate and modify code.

**TypeORM Usage**: Leverages ORM features appropriately without fighting against it. Relations and query builder used where they make sense.

**Validation Layer**: Joi schemas catch issues early. Consistent validation pattern across all entities.

**Pagination**: Uniform implementation across endpoints. Good defaults with override capability.
