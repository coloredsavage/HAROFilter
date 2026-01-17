import { NewMatchEmailData } from '@/types/haro';
import { isDeadlineUrgent } from '@/lib/email/parser';

/**
 * Generate HTML email template for new query matches
 */
export function generateNewMatchEmail(data: NewMatchEmailData): string {
  const { userName, queries, dashboardUrl, unsubscribeUrl } = data;

  // Limit to top 5 queries
  const displayQueries = queries.slice(0, 5);
  const hasMore = queries.length > 5;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New HARO Matches</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .query-card {
      background-color: #f9fafb;
      border-left: 4px solid #4F46E5;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .query-card.urgent {
      border-left-color: #DC2626;
      background-color: #FEF2F2;
    }
    .query-headline {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 10px 0;
    }
    .query-meta {
      font-size: 14px;
      color: #6B7280;
      margin: 8px 0;
    }
    .query-meta strong {
      color: #374151;
    }
    .deadline {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    .deadline.urgent {
      background-color: #FEE2E2;
      color: #DC2626;
    }
    .deadline.normal {
      background-color: #E0E7FF;
      color: #4F46E5;
    }
    .keywords {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .keyword-tag {
      display: inline-block;
      background-color: #E0E7FF;
      color: #4F46E5;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .cta-button {
      display: inline-block;
      background-color: #4F46E5;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 30px 0 20px 0;
      text-align: center;
    }
    .more-queries {
      text-align: center;
      color: #6B7280;
      font-size: 14px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #9CA3AF;
      font-size: 12px;
    }
    .footer a {
      color: #4F46E5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New HARO Matches!</h1>
      <p>Hi ${userName}, we found ${queries.length} new ${queries.length === 1 ? 'query' : 'queries'} matching your keywords</p>
    </div>

    ${displayQueries.map((query) => {
      const urgent = isDeadlineUrgent(query.deadline);
      const deadlineStr = formatDeadline(query.deadline);

      return `
    <div class="query-card ${urgent ? 'urgent' : ''}">
      <h2 class="query-headline">${escapeHtml(query.headline)}</h2>
      <div class="query-meta">
        <strong>Publication:</strong> ${escapeHtml(query.publication)}
      </div>
      <div class="query-meta">
        <strong>Deadline:</strong>
        <span class="deadline ${urgent ? 'urgent' : 'normal'}">
          ${urgent ? '⚠️ URGENT: ' : ''}${deadlineStr}
        </span>
      </div>
      <div class="keywords">
        ${query.matchedKeywords.map((keyword) => `<span class="keyword-tag">${escapeHtml(keyword)}</span>`).join('')}
      </div>
    </div>
      `;
    }).join('')}

    ${hasMore ? `<div class="more-queries">+ ${queries.length - 5} more ${queries.length - 5 === 1 ? 'match' : 'matches'} in your dashboard</div>` : ''}

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="cta-button">View All Matches</a>
    </div>

    <div class="footer">
      <p>You're receiving this because you have email notifications enabled for new matches.</p>
      <p><a href="${unsubscribeUrl}">Manage notification settings</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format deadline for display
 */
function formatDeadline(deadline: Date): string {
  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return 'Expired';
  } else if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} remaining`;
  } else if (diffHours < 48) {
    return 'Tomorrow';
  } else {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return deadline.toLocaleDateString('en-US', options);
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
