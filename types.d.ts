export interface GChatReminderSettings {
	webhookUrl: string;
	notifiedTasks: string[];
}

export interface Task {
	content: string;
	dueDateTime: Date;
}
