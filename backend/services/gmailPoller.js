const { google } = require('googleapis');
const config = require('../config');
const db = require('../database/db');

class GmailPoller {
  constructor() {
    this.gmail = null;
    this.oauth2Client = null;
    this.isPolling = false;
    this.pollInterval = null;
  }

  async initialize() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        config.gmail.clientId,
        config.gmail.clientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      this.oauth2Client.setCredentials({
        refresh_token: config.gmail.refreshToken
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      console.log('Gmail poller initialized successfully');
    } catch (err) {
      console.error('Gmail poller initialization error:', err);
      throw err;
    }
  }

  async startPolling(onEmailReceived) {
    if (this.isPolling) {
      console.log('Gmail poller already running');
      return;
    }

    this.isPolling = true;
    console.log('Starting Gmail poller...');

    const poll = async () => {
      try {
        await this.pollEmails(onEmailReceived);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Initial poll
    await poll();

    // Set up interval
    this.pollInterval = setInterval(poll, config.gmail.pollIntervalMs);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('Gmail poller stopped');
  }

  async pollEmails(onEmailReceived) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: config.gmail.pollQuery,
        maxResults: 10
      });

      const messages = response.data.messages || [];

      for (const message of messages) {
        // Check if already processed
        if (await db.isEmailProcessed(message.id)) {
          continue;
        }

        // Fetch full message
        const fullMessage = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const email = this.parseEmail(fullMessage.data);
        
        // Mark as processed immediately to avoid duplicates
        await db.markEmailProcessed(message.id);

        // Call the callback with parsed email
        if (onEmailReceived) {
          await onEmailReceived(email);
        }
      }
    } catch (err) {
      console.error('Error polling emails:', err);
      throw err;
    }
  }

  parseEmail(message) {
    const headers = message.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    let body = '';
    if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload.parts) {
      const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      id: message.id,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      body: body.trim(),
      date: getHeader('Date'),
      threadId: message.threadId
    };
  }

  extractEmail(emailString) {
    const match = emailString.match(/<(.+?)>/) || emailString.match(/([^\s]+@[^\s]+)/);
    return match ? match[1] : emailString;
  }

  async sendEmail(to, subject, body) {
    try {
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body
      ].join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      console.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      console.error('Error sending email:', err);
      throw err;
    }
  }

  async replyToEmail(threadId, to, subject, body) {
    try {
      const message = [
        `To: ${to}`,
        `Subject: Re: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body
      ].join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: threadId
        }
      });

      console.log(`Reply sent to ${to} in thread ${threadId}`);
    } catch (err) {
      console.error('Error replying to email:', err);
      throw err;
    }
  }
}

module.exports = new GmailPoller();
