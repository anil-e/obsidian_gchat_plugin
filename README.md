# Google Chat Reminder for Obsidian

This Obsidian plugin allows tasks within notes to be marked with a specific format, triggering automatic reminders to Google Chat when they are due. Once a task is identified as due, a notification is sent to Google Chat via a webhook.

## Details

**Task Marking Format**:  
Tasks can be marked using the format `(gChat@YYYY-MM-DD HH:MM)` to set their due dates and times.

**Webhook URL Configuration**:  
Navigate to the plugin settings in Obsidian and input the Webhook URL for your Google Chat room.

**Scan Interval**:  
The plugin checks all notes for due tasks every 3 minutes.

**Network Considerations**:  
This plugin communicates with Google Chat via the internet. It sends only the content of the marked reminder and its associated due date. No other data from your Obsidian Vault is transmitted or stored externally.

## Usage

1. **Mark Your Tasks**: Within your Obsidian notes, mark any task with the specified format.
2. **Set Webhook**: Input the webhook URL in the plugin settings.
3. **Receive Notifications**: Once a task reaches its due date and time, you'll receive a notification in Google Chat.