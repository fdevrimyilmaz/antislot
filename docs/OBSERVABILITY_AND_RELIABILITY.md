# Observability and Reliability

## Alerting

- Set `ALERT_WEBHOOK_URL` in runtime environment to receive operational alerts.
- Keep the webhook endpoint private and rotate credentials regularly.

## Minimum Monitoring

- Track API health and error rates for `server`.
- Review crash reporting consent behavior before release.
- Verify privacy preferences gate telemetry and crash reports.
