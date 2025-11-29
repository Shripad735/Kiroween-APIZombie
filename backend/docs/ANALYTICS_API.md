# Analytics API Documentation

## Overview

The Analytics API provides comprehensive insights into API request history, including success rates, response times, endpoint usage patterns, and time-based trends.

## Endpoint

```
GET /api/analytics
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `userId` | string | `'default-user'` | Filter analytics by user ID |
| `startDate` | ISO date string | - | Start date for analytics range |
| `endDate` | ISO date string | - | End date for analytics range |
| `groupBy` | string | `'daily'` | Time grouping: `'daily'`, `'weekly'`, or `'monthly'` |

## Response Format

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 228,
      "successfulRequests": 180,
      "failedRequests": 48,
      "successRate": 78.95,
      "averageResponseTime": 594.98
    },
    "mostUsedEndpoints": [
      {
        "endpoint": "/api/users",
        "method": "GET",
        "protocol": "rest",
        "count": 22,
        "avgDuration": 539.45,
        "successRate": 86.36
      }
    ],
    "timeSeriesData": [
      {
        "date": "2024-01-15T00:00:00.000Z",
        "totalRequests": 8,
        "successfulRequests": 6,
        "successRate": 75.0,
        "avgDuration": 523.45
      }
    ],
    "protocolBreakdown": [
      {
        "protocol": "rest",
        "count": 71,
        "percentage": 31.14,
        "successRate": 81.69
      }
    ],
    "statusCodeDistribution": [
      {
        "statusCode": 200,
        "count": 180
      },
      {
        "statusCode": 500,
        "count": 48
      }
    ]
  }
}
```

## Usage Examples

### Get Daily Analytics

```bash
curl "http://localhost:5000/api/analytics?groupBy=daily"
```

### Get Analytics for Date Range

```bash
curl "http://localhost:5000/api/analytics?startDate=2024-01-01&endDate=2024-01-31&groupBy=weekly"
```

### Get Monthly Analytics for Specific User

```bash
curl "http://localhost:5000/api/analytics?userId=user123&groupBy=monthly"
```

## Data Insights

### Summary Statistics
- **Total Requests**: Count of all API requests in the time range
- **Success Rate**: Percentage of successful requests (status 2xx)
- **Average Response Time**: Mean duration of all requests in milliseconds

### Most Used Endpoints
- Top 10 endpoints by request count
- Includes average duration and success rate per endpoint
- Grouped by endpoint, method, and protocol

### Time Series Data
- Request volume and success rate over time
- Supports daily, weekly, and monthly grouping
- Useful for trend analysis and charting

### Protocol Breakdown
- Distribution of requests across REST, GraphQL, and gRPC
- Shows percentage and success rate per protocol

### Status Code Distribution
- Count of requests by HTTP status code
- Helps identify error patterns

## Frontend Integration

The analytics data is structured for easy integration with charting libraries like Chart.js, Recharts, or D3.js:

```javascript
// Example: Fetch and display analytics
const response = await fetch('/api/analytics?groupBy=daily');
const { data } = await response.json();

// Use data.timeSeriesData for line charts
// Use data.protocolBreakdown for pie charts
// Use data.mostUsedEndpoints for bar charts
```

## Performance Considerations

- Analytics queries use MongoDB aggregation pipelines for efficiency
- Indexes on `userId`, `timestamp`, `protocol`, and `statusCode` optimize query performance
- Consider caching analytics results for frequently accessed date ranges
- Large date ranges may take longer to process

## Requirements Validation

This endpoint satisfies **Requirement 7.3**:
> WHEN a user views analytics, THEN the System SHALL show statistics like success rate, average response time, and most-used endpoints
