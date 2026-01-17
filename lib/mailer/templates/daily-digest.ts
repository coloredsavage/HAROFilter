import { DigestEmailData } from '@/types/haro';

/**
 * Generate HTML email template for daily digest
 */
export function generateDigestEmail(data: DigestEmailData): string {
  const { userName, date, queries, totalMatches, dashboardUrl, unsubscribeUrl } = data;

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily HARO Digest</title>
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
    .summary {
      background-color: #EEF2FF;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .summary-number {
      font-size: 48px;
      font-weight: 700;
      color: #4F46E5;
      margin: 0;
    }
    .summary-text {
      color: #6B7280;
      margin: 8px 0 0 0;
      font-size: 16px;
    }
    .query-list {
      margin: 20px 0;
    }
    .query-item {
      border-bottom: 1px solid #E5E7EB;
      padding: 16px 0;
    }
    .query-item:last-child {
      border-bottom: none;
    }
    .query-headline {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .query-meta {
      font-size: 13px;
      color: #6B7280;
      margin: 4px 0;
    }
    .query-meta strong {
      color: #374151;
    }
    .keywords {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .keyword-tag {
      display: inline-block;
      background-color: #E0E7FF;
      color: #4F46E5;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 11px;
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
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #6B7280;
    }
    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 16px;
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
      <h1>📊 Your Daily Digest</h1>
      <p>${dateStr}</p>
    </div>

    <div class="summary">
      <h2 class="summary-number">${totalMatches}</h2>
      <p class="summary-text">${totalMatches === 1 ? 'Match' : 'Matches'} Found in the Last 24 Hours</p>
    </div>

    ${totalMatches === 0 ? `
    <div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <p>No new matches found in the last 24 hours.</p>
      <p style="font-size: 14px; margin-top: 8px;">Try adding more keywords to increase your match rate.</p>
    </div>
    ` : `
    <div class="query-list">
      ${queries.map((query) => {
        const deadlineStr = query.deadline.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

        return `
      <div class="query-item">
        <h3 class="query-headline">${escapeHtml(query.headline)}</h3>
        <div class="query-meta">
          <strong>Publication:</strong> ${escapeHtml(query.publication)}
        </div>
        <div class="query-meta">
          <strong>Deadline:</strong> ${deadlineStr}
        </div>
        <div class="keywords">
          ${query.matchedKeywords.map((keyword) => `<span class="keyword-tag">${escapeHtml(keyword)}</span>`).join('')}
        </div>
      </div>
        `;
      }).join('')}
    </div>
    `}

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="cta-button">View Dashboard</a>
    </div>

    <div class="footer">
      <p>You're receiving this daily digest at 8:00 AM.</p>
      <p><a href="${unsubscribeUrl}">Manage notification settings</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
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
