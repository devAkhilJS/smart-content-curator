export function validateScheduleDateTime(datetimeValue: string): string | null {
  if (!datetimeValue) {
    return 'Date and time are required for scheduling';
  }
  const scheduledDateTime = new Date(datetimeValue);
  if (isNaN(scheduledDateTime.getTime())) {
    return 'Invalid date or time format';
  }
  const now = new Date();
  const oneMinuteFromNow = new Date(now.getTime() + 60000); 
  
  if (scheduledDateTime <= oneMinuteFromNow) {
    return 'Scheduled time must be at least 1 minute in the future';
  }
  return null; 
}
export function validateScheduleDateTimeComponents(scheduleDate: string, scheduleTime: string): string | null {
  if (!scheduleDate || !scheduleTime) {
    return 'Both date and time are required for scheduling';
  }
  
  return validateScheduleDateTime(`${scheduleDate}T${scheduleTime}`);
}
