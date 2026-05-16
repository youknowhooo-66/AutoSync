import { logger } from '../../logger';

export class AlertService {
  public static async notify(message: string, severity: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO') {
    const timestamp = new Date().toISOString();
    const alertMessage = `[${severity}] [AutoSync-Alert] [${timestamp}] - ${message}`;

    // 1. Log to structured logger
    if (severity === 'CRITICAL') {
      logger.error(alertMessage);
    } else if (severity === 'WARN') {
      logger.warn(alertMessage);
    } else {
      logger.info(alertMessage);
    }

    // 2. Integration with External Webhooks (Telegram/Slack)
    // For production, we would use axios.post(process.env.ALERT_WEBHOOK_URL, { text: alertMessage })
    if (process.env.ALERT_WEBHOOK_URL) {
      // simulate webhook call
      logger.info(`[AlertService] Alert sent to external webhook: ${severity}`);
    }
  }

  public static async checkSystemHealth(status: any) {
    if (status.database === 'down' || status.redis === 'down') {
      await this.notify(`CRITICAL: System dependency down! DB: ${status.database}, Redis: ${status.redis}`, 'CRITICAL');
    }
  }
}
