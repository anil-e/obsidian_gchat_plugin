export interface GChatReminderSettings {
	webhookUrl: string;
}

export interface Task {
	content: string;
	dueDateTime: Date;
}
